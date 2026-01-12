import { prisma } from '../lib/prisma.js';
import { bulkIndexPins } from '../lib/elasticsearch.js';
import bcrypt from 'bcrypt';

// Sample data for seeding
const categories = [
  'Nature', 'Travel', 'Food', 'Art', 'Architecture', 'Fashion', 
  'Interior Design', 'Photography', 'Animals', 'Technology'
];

const samplePins = [
  // Nature
  { title: 'Mountain Sunrise', description: 'Breathtaking sunrise over snow-capped mountains', tags: ['nature', 'mountains', 'sunrise', 'landscape'], imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' },
  { title: 'Autumn Forest Path', description: 'A winding path through colorful autumn trees', tags: ['nature', 'forest', 'autumn', 'trees'], imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800' },
  { title: 'Ocean Waves Crashing', description: 'Powerful waves meeting the rocky shore', tags: ['nature', 'ocean', 'waves', 'beach'], imageUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800' },
  { title: 'Northern Lights Display', description: 'Stunning aurora borealis over a snowy landscape', tags: ['nature', 'aurora', 'night', 'sky'], imageUrl: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=800' },
  { title: 'Wildflower Meadow', description: 'Colorful wildflowers in a summer meadow', tags: ['nature', 'flowers', 'meadow', 'summer'], imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800' },
  
  // Travel
  { title: 'Santorini Greece', description: 'Iconic blue domes against the Aegean sea', tags: ['travel', 'greece', 'santorini', 'europe'], imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800' },
  { title: 'Tokyo Night Lights', description: 'Neon-lit streets of Shibuya at night', tags: ['travel', 'japan', 'tokyo', 'city', 'night'], imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800' },
  { title: 'Machu Picchu Vista', description: 'Ancient Incan citadel in the Andes', tags: ['travel', 'peru', 'history', 'mountains'], imageUrl: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800' },
  { title: 'Venice Canals', description: 'Gondolas gliding through Venetian waterways', tags: ['travel', 'italy', 'venice', 'europe', 'romantic'], imageUrl: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=800' },
  { title: 'Safari Adventure', description: 'Elephants roaming the African savanna', tags: ['travel', 'africa', 'safari', 'wildlife', 'animals'], imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800' },
  
  // Food
  { title: 'Homemade Pizza', description: 'Fresh Margherita pizza straight from the oven', tags: ['food', 'pizza', 'italian', 'cooking', 'recipe'], imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800' },
  { title: 'Sushi Platter', description: 'Beautifully arranged assortment of fresh sushi', tags: ['food', 'sushi', 'japanese', 'seafood'], imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800' },
  { title: 'Chocolate Cake', description: 'Decadent triple chocolate layer cake', tags: ['food', 'dessert', 'chocolate', 'baking', 'cake'], imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800' },
  { title: 'Smoothie Bowl', description: 'Colorful acai bowl with fresh toppings', tags: ['food', 'healthy', 'breakfast', 'smoothie', 'vegan'], imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800' },
  { title: 'Fresh Pasta', description: 'Handmade fettuccine with creamy sauce', tags: ['food', 'pasta', 'italian', 'cooking', 'homemade'], imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800' },
  
  // Art
  { title: 'Abstract Watercolor', description: 'Flowing colors in a dreamlike composition', tags: ['art', 'watercolor', 'abstract', 'painting'], imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800' },
  { title: 'Digital Portrait', description: 'Modern digital art portrait illustration', tags: ['art', 'digital', 'portrait', 'illustration'], imageUrl: 'https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=800' },
  { title: 'Sculpture Garden', description: 'Contemporary sculptures in an outdoor gallery', tags: ['art', 'sculpture', 'modern', 'gallery'], imageUrl: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800' },
  { title: 'Street Mural', description: 'Vibrant street art on a city wall', tags: ['art', 'street art', 'mural', 'urban'], imageUrl: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800' },
  { title: 'Oil Painting', description: 'Classic oil painting technique demonstration', tags: ['art', 'oil painting', 'classical', 'technique'], imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800' },
  
  // Architecture
  { title: 'Modern Skyscraper', description: 'Glass and steel reaching for the sky', tags: ['architecture', 'modern', 'skyscraper', 'city'], imageUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800' },
  { title: 'Gothic Cathedral', description: 'Intricate Gothic architecture details', tags: ['architecture', 'gothic', 'cathedral', 'historical'], imageUrl: 'https://images.unsplash.com/photo-1548795899-0c9abbbcdf02?w=800' },
  { title: 'Minimalist Home', description: 'Clean lines and open spaces', tags: ['architecture', 'minimalist', 'home', 'interior'], imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800' },
  { title: 'Japanese Temple', description: 'Traditional Japanese temple architecture', tags: ['architecture', 'japan', 'temple', 'traditional'], imageUrl: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800' },
  { title: 'Spiral Staircase', description: 'Mesmerizing spiral staircase from above', tags: ['architecture', 'stairs', 'geometric', 'design'], imageUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800' },
  
  // Fashion
  { title: 'Summer Outfit Inspo', description: 'Casual summer style inspiration', tags: ['fashion', 'summer', 'outfit', 'style'], imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800' },
  { title: 'Minimalist Wardrobe', description: 'Building a capsule wardrobe', tags: ['fashion', 'minimalist', 'wardrobe', 'style tips'], imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800' },
  { title: 'Vintage Fashion', description: 'Retro style from the 70s', tags: ['fashion', 'vintage', 'retro', '70s'], imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800' },
  { title: 'Street Style', description: 'Urban fashion photography', tags: ['fashion', 'street style', 'urban', 'photography'], imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800' },
  { title: 'Accessories Collection', description: 'Curated jewelry and accessories', tags: ['fashion', 'accessories', 'jewelry', 'style'], imageUrl: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800' },
  
  // Interior Design
  { title: 'Cozy Living Room', description: 'Warm and inviting living space', tags: ['interior', 'living room', 'cozy', 'home decor'], imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800' },
  { title: 'Scandinavian Bedroom', description: 'Clean Nordic design principles', tags: ['interior', 'bedroom', 'scandinavian', 'minimalist'], imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800' },
  { title: 'Kitchen Goals', description: 'Modern kitchen with marble countertops', tags: ['interior', 'kitchen', 'modern', 'marble'], imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800' },
  { title: 'Home Office Setup', description: 'Productive and stylish workspace', tags: ['interior', 'office', 'workspace', 'productivity'], imageUrl: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800' },
  { title: 'Bathroom Spa', description: 'Luxurious spa-like bathroom design', tags: ['interior', 'bathroom', 'spa', 'luxury'], imageUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800' },
  
  // Photography
  { title: 'Golden Hour Portrait', description: 'Portrait photography in warm light', tags: ['photography', 'portrait', 'golden hour', 'tips'], imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800' },
  { title: 'Long Exposure Stars', description: 'Star trails over mountains', tags: ['photography', 'astrophotography', 'stars', 'night'], imageUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800' },
  { title: 'Macro Flower', description: 'Extreme close-up of flower details', tags: ['photography', 'macro', 'flowers', 'nature'], imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800' },
  { title: 'Black and White Street', description: 'Moody urban street photography', tags: ['photography', 'black and white', 'street', 'urban'], imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800' },
  { title: 'Drone Perspective', description: 'Aerial view of coastline', tags: ['photography', 'drone', 'aerial', 'landscape'], imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' },
  
  // Animals
  { title: 'Golden Retriever', description: 'Happy golden retriever at the park', tags: ['animals', 'dogs', 'pets', 'cute'], imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800' },
  { title: 'Cat Napping', description: 'Peaceful cat taking a sunbath', tags: ['animals', 'cats', 'pets', 'cute'], imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800' },
  { title: 'Wild Horses', description: 'Free-roaming horses in Iceland', tags: ['animals', 'horses', 'wildlife', 'iceland'], imageUrl: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800' },
  { title: 'Colorful Parrot', description: 'Vibrant macaw in tropical setting', tags: ['animals', 'birds', 'parrot', 'tropical'], imageUrl: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=800' },
  { title: 'Underwater World', description: 'Tropical fish in coral reef', tags: ['animals', 'fish', 'ocean', 'underwater'], imageUrl: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=800' },
  
  // Technology
  { title: 'Workspace Setup', description: 'Clean developer desk setup', tags: ['technology', 'workspace', 'setup', 'productivity'], imageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800' },
  { title: 'Circuit Board Art', description: 'Close-up of electronic circuits', tags: ['technology', 'electronics', 'circuits', 'macro'], imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800' },
  { title: 'Smart Home', description: 'Modern connected home technology', tags: ['technology', 'smart home', 'iot', 'modern'], imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800' },
  { title: 'VR Experience', description: 'Virtual reality gaming setup', tags: ['technology', 'vr', 'gaming', 'future'], imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=800' },
  { title: 'Mechanical Keyboard', description: 'Custom mechanical keyboard build', tags: ['technology', 'keyboard', 'mechanical', 'custom'], imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800' },
];

async function seed() {
  console.log('🌱 Starting seed...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@example.com' },
      update: {},
      create: {
        email: 'alice@example.com',
        username: 'alice',
        password: hashedPassword,
        bio: 'Nature and travel photographer 📸',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@example.com' },
      update: {},
      create: {
        email: 'bob@example.com',
        username: 'bob',
        password: hashedPassword,
        bio: 'Food lover & home chef 🍕',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
    }),
    prisma.user.upsert({
      where: { email: 'carol@example.com' },
      update: {},
      create: {
        email: 'carol@example.com',
        username: 'carol',
        password: hashedPassword,
        bio: 'Interior designer & minimalist 🏠',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      },
    }),
    prisma.user.upsert({
      where: { email: 'david@example.com' },
      update: {},
      create: {
        email: 'david@example.com',
        username: 'david',
        password: hashedPassword,
        bio: 'Tech enthusiast & developer 💻',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Delete existing pins (optional - comment out if you want to keep existing)
  await prisma.pin.deleteMany({});
  console.log('🗑️  Cleared existing pins');

  // Create pins distributed across users
  const pinsToCreate = samplePins.map((pin, index) => ({
    ...pin,
    userId: users[index % users.length].id,
  }));

  const createdPins = await prisma.pin.createManyAndReturn({
    data: pinsToCreate,
  });

  console.log(`✅ Created ${createdPins.length} pins`);

  // Index all pins in Elasticsearch
  const pinsForIndex = await prisma.pin.findMany({
    include: {
      user: {
        select: { username: true },
      },
    },
  });

  const pinDocs = pinsForIndex.map((pin) => ({
    id: pin.id,
    title: pin.title,
    description: pin.description,
    imageUrl: pin.imageUrl,
    tags: pin.tags,
    userId: pin.userId,
    username: pin.user.username,
    createdAt: pin.createdAt.toISOString(),
  }));

  await bulkIndexPins(pinDocs);
  console.log(`✅ Indexed ${pinDocs.length} pins in Elasticsearch`);

  // Create some boards
  const boards = await Promise.all([
    prisma.board.create({
      data: {
        name: 'Travel Inspiration',
        description: 'Places I want to visit',
        userId: users[0].id,
      },
    }),
    prisma.board.create({
      data: {
        name: 'Recipe Ideas',
        description: 'Dishes to try',
        userId: users[1].id,
      },
    }),
    prisma.board.create({
      data: {
        name: 'Home Decor',
        description: 'Interior design ideas',
        userId: users[2].id,
      },
    }),
  ]);

  console.log(`✅ Created ${boards.length} boards`);

  // Save some pins to boards
  const travelPins = createdPins.filter((p) => p.tags.includes('travel'));
  const foodPins = createdPins.filter((p) => p.tags.includes('food'));
  const interiorPins = createdPins.filter((p) => p.tags.includes('interior'));

  await Promise.all([
    ...travelPins.slice(0, 3).map((pin) =>
      prisma.savedPin.create({
        data: { pinId: pin.id, boardId: boards[0].id, userId: users[0].id },
      })
    ),
    ...foodPins.slice(0, 3).map((pin) =>
      prisma.savedPin.create({
        data: { pinId: pin.id, boardId: boards[1].id, userId: users[1].id },
      })
    ),
    ...interiorPins.slice(0, 3).map((pin) =>
      prisma.savedPin.create({
        data: { pinId: pin.id, boardId: boards[2].id, userId: users[2].id },
      })
    ),
  ]);

  console.log('✅ Added pins to boards');

  // Create some follows
  await Promise.all([
    prisma.follow.create({ data: { followerId: users[0].id, followingId: users[1].id } }),
    prisma.follow.create({ data: { followerId: users[0].id, followingId: users[2].id } }),
    prisma.follow.create({ data: { followerId: users[1].id, followingId: users[0].id } }),
    prisma.follow.create({ data: { followerId: users[2].id, followingId: users[0].id } }),
    prisma.follow.create({ data: { followerId: users[3].id, followingId: users[0].id } }),
  ]);

  console.log('✅ Created follow relationships');

  // Add some comments
  const randomPins = createdPins.slice(0, 10);
  await Promise.all(
    randomPins.map((pin, i) =>
      prisma.comment.create({
        data: {
          content: ['Amazing!', 'Love this!', 'So inspiring', 'Beautiful shot', 'Need to try this'][i % 5],
          pinId: pin.id,
          userId: users[(i + 1) % users.length].id,
        },
      })
    )
  );

  console.log('✅ Added comments');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\nTest accounts (password: password123):');
  console.log('- alice@example.com');
  console.log('- bob@example.com');
  console.log('- carol@example.com');
  console.log('- david@example.com');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
