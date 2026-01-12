import { prisma } from '../lib/prisma.js';
import { Client } from '@elastic/elasticsearch';

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

async function reindex() {
  console.log('🔄 Re-indexing pins in Elasticsearch...');

  const esClient = new Client({ node: ELASTICSEARCH_URL });

  // Get all pins from database
  const pins = await prisma.pin.findMany({
    include: {
      user: {
        select: { username: true },
      },
    },
  });

  console.log(`Found ${pins.length} pins to index`);

  if (pins.length === 0) {
    console.log('No pins to index');
    return;
  }

  const operations = pins.flatMap((pin) => [
    { index: { _index: 'pins', _id: pin.id } },
    {
      id: pin.id,
      title: pin.title,
      description: pin.description,
      imageUrl: pin.imageUrl,
      tags: pin.tags,
      userId: pin.userId,
      username: pin.user.username,
      createdAt: pin.createdAt.toISOString(),
    },
  ]);

  const result = await esClient.bulk({ refresh: true, operations });
  
  if (result.errors) {
    console.error('Some documents failed to index:', result.items.filter((item: any) => item.index?.error));
  }

  console.log(`✅ Indexed ${pins.length} pins successfully!`);
}

reindex()
  .catch((e) => {
    console.error('❌ Re-index failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
