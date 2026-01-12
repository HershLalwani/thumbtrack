import { Client } from '@elastic/elasticsearch';

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

export const esClient = new Client({
  node: ELASTICSEARCH_URL,
});

const PINS_INDEX = 'pins';

let elasticsearchAvailable = false;

export function isElasticsearchAvailable() {
  return elasticsearchAvailable;
}

// Pin document type for Elasticsearch
interface PinDocument {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  tags: string[];
  userId: string;
  username: string;
  createdAt: string;
}

// Initialize the pins index with proper mappings
export async function initializeElasticsearch() {
  try {
    // Check if Elasticsearch is available
    await esClient.ping();
    elasticsearchAvailable = true;
    console.log('Elasticsearch is available');

    const indexExists = await esClient.indices.exists({ index: PINS_INDEX });

    if (!indexExists) {
      await esClient.indices.create({
        index: PINS_INDEX,
        settings: {
          analysis: {
            analyzer: {
              pin_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding', 'edge_ngram_filter'],
              },
              pin_search_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding'],
              },
            },
            filter: {
              edge_ngram_filter: {
                type: 'edge_ngram',
                min_gram: 2,
                max_gram: 20,
              },
            },
          },
        },
        mappings: {
          properties: {
            id: { type: 'keyword' },
            title: {
              type: 'text',
              analyzer: 'pin_analyzer',
              search_analyzer: 'pin_search_analyzer',
              fields: {
                keyword: { type: 'keyword' },
              },
            },
            description: {
              type: 'text',
              analyzer: 'pin_analyzer',
              search_analyzer: 'pin_search_analyzer',
            },
            imageUrl: { type: 'keyword' },
            tags: {
              type: 'text',
              analyzer: 'pin_analyzer',
              search_analyzer: 'pin_search_analyzer',
              fields: {
                keyword: { type: 'keyword' },
              },
            },
            userId: { type: 'keyword' },
            username: { type: 'keyword' },
            createdAt: { type: 'date' },
          },
        },
      });
      console.log('Created pins index');
    }
  } catch (error) {
    console.log('Elasticsearch not available, search will use database fallback');
    elasticsearchAvailable = false;
  }
}

// Index a single pin
export async function indexPin(pin: PinDocument) {
  if (!elasticsearchAvailable) return;
  
  try {
    await esClient.index({
      index: PINS_INDEX,
      id: pin.id,
      document: pin,
    });
  } catch (error) {
    console.error('Failed to index pin:', error);
  }
}

// Index multiple pins
export async function bulkIndexPins(pins: PinDocument[]) {
  if (pins.length === 0 || !elasticsearchAvailable) return;

  try {
    const operations = pins.flatMap((pin) => [
      { index: { _index: PINS_INDEX, _id: pin.id } },
      pin,
    ]);

    await esClient.bulk({ refresh: true, operations });
  } catch (error) {
    console.error('Failed to bulk index pins:', error);
  }
}

// Delete a pin from the index
export async function deletePin(pinId: string) {
  if (!elasticsearchAvailable) return;
  
  try {
    await esClient.delete({
      index: PINS_INDEX,
      id: pinId,
    });
  } catch (error) {
    console.error('Failed to delete pin from index:', error);
  }
}

// Search pins
export async function searchPins(
  query: string,
  options: { page?: number; limit?: number; tags?: string[] } = {}
) {
  const { page = 1, limit = 20, tags } = options;
  const from = (page - 1) * limit;

  try {
    const must: any[] = [];
    const should: any[] = [];

    if (query) {
      should.push(
        { match: { title: { query, boost: 3 } } },
        { match: { description: { query, boost: 1 } } },
        { match: { tags: { query, boost: 2 } } },
        { match: { username: { query, boost: 1 } } }
      );
    }

    if (tags && tags.length > 0) {
      must.push({
        terms: { 'tags.keyword': tags },
      });
    }

    const body: any = {
      from,
      size: limit,
      query: {
        bool: {
          must: must.length > 0 ? must : undefined,
          should: should.length > 0 ? should : undefined,
          minimum_should_match: should.length > 0 ? 1 : undefined,
        },
      },
      sort: query
        ? [{ _score: 'desc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }],
    };

    const result = await esClient.search({
      index: PINS_INDEX,
      body,
    });

    const hits = result.hits.hits;
    const total =
      typeof result.hits.total === 'number'
        ? result.hits.total
        : result.hits.total?.value || 0;

    return {
      pins: hits.map((hit: any) => ({
        id: hit._source.id,
        title: hit._source.title,
        description: hit._source.description,
        imageUrl: hit._source.imageUrl,
        tags: hit._source.tags,
        userId: hit._source.userId,
        username: hit._source.username,
        createdAt: hit._source.createdAt,
        score: hit._score,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Search failed:', error);
    return {
      pins: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    };
  }
}

// Get suggestions (autocomplete)
export async function getSuggestions(query: string, limit = 10) {
  try {
    const result = await esClient.search({
      index: PINS_INDEX,
      size: limit,
      query: {
        bool: {
          should: [
            {
              match_phrase_prefix: {
                title: {
                  query,
                  max_expansions: 50,
                },
              },
            },
            {
              match_phrase_prefix: {
                'tags.keyword': {
                  query,
                  max_expansions: 50,
                },
              },
            },
          ],
        },
      },
      _source: ['title', 'tags'],
    });

    const suggestions = new Set<string>();
    result.hits.hits.forEach((hit: any) => {
      if (hit._source.title?.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(hit._source.title);
      }
      hit._source.tags?.forEach((tag: string) => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  } catch (error) {
    console.error('Suggestions failed:', error);
    return [];
  }
}

// Get popular tags
export async function getPopularTags(limit = 20) {
  try {
    const result = await esClient.search({
      index: PINS_INDEX,
      size: 0,
      aggs: {
        popular_tags: {
          terms: {
            field: 'tags.keyword',
            size: limit,
          },
        },
      },
    });

    const buckets = (result.aggregations?.popular_tags as any)?.buckets || [];
    return buckets.map((bucket: any) => ({
      tag: bucket.key,
      count: bucket.doc_count,
    }));
  } catch (error) {
    console.error('Failed to get popular tags:', error);
    return [];
  }
}
