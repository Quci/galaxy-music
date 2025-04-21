const fs = require('fs');
const path = require('path');

// 定义天体类型
const celestialTypes = ['planet', 'star', 'blackHole', 'moon', 'comet', 'neutronStar', 'nebula', 'galaxy'];

// 定义一些流行艺术家名字
const artists = [
  'David Bowie', 'Pink Floyd', 'Daft Punk', 'Muse', 'Björk', 'Radiohead', 'The Weeknd', 
  'Coldplay', 'Lady Gaga', 'Taylor Swift', 'BTS', 'Imagine Dragons', 'Bruno Mars',
  'Billie Eilish', 'Beyoncé', 'Ed Sheeran', 'Drake', 'Ariana Grande', 'The Beatles',
  'Queen', 'Michael Jackson', 'Adele', 'Frank Ocean', 'Kendrick Lamar', 'Kanye West'
];

// 定义一些空间和宇宙相关的词汇，用于生成歌曲名
const spaceWords = [
  'Star', 'Moon', 'Sky', 'Cosmic', 'Galaxy', 'Universe', 'Solar', 'Space', 'Orbit',
  'Planet', 'Stellar', 'Nebula', 'Comet', 'Meteor', 'Astral', 'Celestial', 'Interstellar',
  'Eclipse', 'Aurora', 'Light', 'Void', 'Dark', 'Bright', 'Shine', 'Glow', 'Dream',
  'Odyssey', 'Journey', 'Voyage', 'Constellation', 'Dimension', 'Infinity', 'Beyond',
  'Horizon', 'Cosmos', 'Nova', 'Pulsar', 'Quasar', 'Dust', 'Gravity', 'Satellite'
];

// 定义一些歌曲形容词
const songAdjectives = [
  'Beautiful', 'Distant', 'Endless', 'Eternal', 'Falling', 'Glowing', 'Hidden', 'Lonely',
  'Magical', 'Mysterious', 'Peaceful', 'Quiet', 'Rising', 'Secret', 'Silent', 'Sparkling',
  'Wandering', 'Whispering', 'Drifting', 'Floating', 'Dancing', 'Dreaming', 'Flying',
  'Spinning', 'Traveling', 'Soaring', 'Orbiting', 'Gazing', 'Shimmering', 'Twinkling'
];

// 定义一些歌曲名后缀
const songSuffixes = [
  'Dreams', 'Light', 'Love', 'Heart', 'Mind', 'Soul', 'Eyes', 'View', 'Life', 'Time',
  'Journey', 'Path', 'Way', 'Road', 'Dance', 'Song', 'Tale', 'Story', 'Adventure',
  'Voyage', 'Exploration', 'Discovery', 'Experience', 'Destination', 'Flight', 'Trip'
];

// 定义一些真实存在的与宇宙相关的歌曲
const realSongs = [
  { title: "Space Oddity", artist: "David Bowie" },
  { title: "Starman", artist: "David Bowie" },
  { title: "Life On Mars?", artist: "David Bowie" },
  { title: "Rocket Man", artist: "Elton John" },
  { title: "Across the Universe", artist: "The Beatles" },
  { title: "Black Hole Sun", artist: "Soundgarden" },
  { title: "Supermassive Black Hole", artist: "Muse" },
  { title: "Starlight", artist: "Muse" },
  { title: "Intergalactic", artist: "Beastie Boys" },
  { title: "Space Jam", artist: "Quad City DJ's" },
  { title: "Fly Me to the Moon", artist: "Frank Sinatra" },
  { title: "Satellite", artist: "Rise Against" },
  { title: "Man on the Moon", artist: "R.E.M." },
  { title: "Walking on the Moon", artist: "The Police" },
  { title: "Drops of Jupiter", artist: "Train" },
  { title: "Cosmic Girl", artist: "Jamiroquai" },
  { title: "Venus as a Boy", artist: "Björk" },
  { title: "Galaxy Song", artist: "Monty Python" },
  { title: "Mr. Spaceman", artist: "The Byrds" },
  { title: "Astronomy Domine", artist: "Pink Floyd" },
  { title: "Champagne Supernova", artist: "Oasis" },
  { title: "Moonage Daydream", artist: "David Bowie" },
  { title: "Subterranean Homesick Alien", artist: "Radiohead" },
  { title: "2000 Light Years From Home", artist: "The Rolling Stones" },
  { title: "Andromeda", artist: "Gorillaz" }
];

// 随机生成颜色
function getRandomColor() {
  const colors = [
    "#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#9b59b6", 
    "#1abc9c", "#d35400", "#c0392b", "#8e44ad", "#27ae60", 
    "#e67e22", "#2980b9", "#f39c12", "#16a085", "#7f8c8d"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// 随机生成大小
function getRandomSize() {
  return (Math.random() * 1.5 + 0.3).toFixed(1);
}

// 生成随机歌曲名
function generateSongTitle() {
  const random = Math.random();
  
  if (random < 0.3) {
    // 形容词 + 空间词
    return `${songAdjectives[Math.floor(Math.random() * songAdjectives.length)]} ${spaceWords[Math.floor(Math.random() * spaceWords.length)]}`;
  } else if (random < 0.6) {
    // 空间词 + 后缀
    return `${spaceWords[Math.floor(Math.random() * spaceWords.length)]} ${songSuffixes[Math.floor(Math.random() * songSuffixes.length)]}`;
  } else if (random < 0.8) {
    // 单个空间词
    return `${spaceWords[Math.floor(Math.random() * spaceWords.length)]}`;
  } else {
    // 形容词 + 空间词 + 后缀
    return `${songAdjectives[Math.floor(Math.random() * songAdjectives.length)]} ${spaceWords[Math.floor(Math.random() * spaceWords.length)]} ${songSuffixes[Math.floor(Math.random() * songSuffixes.length)]}`;
  }
}

// 生成歌曲数据
function generateSongData() {
  const songs = [];
  
  // 先添加真实歌曲
  realSongs.forEach(song => {
    const type = celestialTypes[Math.floor(Math.random() * celestialTypes.length)];
    const color = getRandomColor();
    const size = getRandomSize();
    
    const celestialBody = {
      type,
      color,
      size: parseFloat(size)
    };
    
    // 为特定类型添加额外属性
    if (type === 'star') {
      celestialBody.luminosity = (Math.random() * 0.7 + 0.3).toFixed(1);
    } else if (type === 'blackHole') {
      celestialBody.accretionDiskColor = getRandomColor();
    } else if (type === 'planet' && Math.random() > 0.7) {
      celestialBody.hasRings = true;
    }
    
    songs.push({
      title: song.title,
      artist: song.artist,
      celestialBody
    });
  });
  
  // 生成剩余的歌曲，直到达到500首
  while (songs.length < 500) {
    const title = generateSongTitle();
    const artist = artists[Math.floor(Math.random() * artists.length)];
    const type = celestialTypes[Math.floor(Math.random() * celestialTypes.length)];
    const color = getRandomColor();
    const size = getRandomSize();
    
    const celestialBody = {
      type,
      color,
      size: parseFloat(size)
    };
    
    // 为特定类型添加额外属性
    if (type === 'star') {
      celestialBody.luminosity = (Math.random() * 0.7 + 0.3).toFixed(1);
    } else if (type === 'blackHole') {
      celestialBody.accretionDiskColor = getRandomColor();
    } else if (type === 'planet' && Math.random() > 0.7) {
      celestialBody.hasRings = true;
    }
    
    // 检查是否有重复标题，如果没有则添加
    if (!songs.some(song => song.title === title)) {
      songs.push({
        title,
        artist,
        celestialBody
      });
    }
  }
  
  return { songs };
}

// 生成歌曲并写入文件
const songsData = generateSongData();
const outputPath = path.join(__dirname, 'data', 'celestial-songs.json');

fs.writeFileSync(outputPath, JSON.stringify(songsData, null, 2));
console.log(`已生成 ${songsData.songs.length} 首歌曲数据到 ${outputPath}`);
