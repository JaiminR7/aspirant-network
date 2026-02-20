const Subject = require('../models/Subject');
const Topic = require('../models/Topic');

// Generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Subjects and Topics for each exam
const examData = {
  'JEE': {
    subjects: [
      {
        name: 'Mathematics',
        slug: 'mathematics',
        description: 'JEE Mathematics - Algebra, Calculus, Coordinate Geometry, etc.',
        topics: [
          { name: 'Algebra', difficulty: 'Medium' },
          { name: 'Calculus', difficulty: 'Hard' },
          { name: 'Coordinate Geometry', difficulty: 'Medium' },
          { name: 'Trigonometry', difficulty: 'Easy' },
          { name: 'Probability & Statistics', difficulty: 'Medium' },
          { name: 'Vectors & 3D Geometry', difficulty: 'Hard' },
          { name: 'Complex Numbers', difficulty: 'Hard' },
          { name: 'Differential Equations', difficulty: 'Hard' },
        ]
      },
      {
        name: 'Physics',
        slug: 'physics',
        description: 'JEE Physics - Mechanics, Electromagnetism, Modern Physics, etc.',
        topics: [
          { name: 'Mechanics', difficulty: 'Medium' },
          { name: 'Thermodynamics', difficulty: 'Medium' },
          { name: 'Electromagnetism', difficulty: 'Hard' },
          { name: 'Optics', difficulty: 'Medium' },
          { name: 'Modern Physics', difficulty: 'Hard' },
          { name: 'Waves & Oscillations', difficulty: 'Medium' },
        ]
      },
      {
        name: 'Chemistry',
        slug: 'chemistry',
        description: 'JEE Chemistry - Organic, Inorganic, Physical Chemistry',
        topics: [
          { name: 'Organic Chemistry', difficulty: 'Hard' },
          { name: 'Inorganic Chemistry', difficulty: 'Medium' },
          { name: 'Physical Chemistry', difficulty: 'Hard' },
          { name: 'Coordination Compounds', difficulty: 'Medium' },
          { name: 'Chemical Bonding', difficulty: 'Medium' },
        ]
      }
    ]
  },
  'NEET': {
    subjects: [
      {
        name: 'Physics',
        slug: 'physics',
        description: 'NEET Physics',
        topics: [
          { name: 'Mechanics', difficulty: 'Medium' },
          { name: 'Thermodynamics', difficulty: 'Medium' },
          { name: 'Electrostatics', difficulty: 'Medium' },
          { name: 'Optics', difficulty: 'Easy' },
          { name: 'Modern Physics', difficulty: 'Medium' },
        ]
      },
      {
        name: 'Chemistry',
        slug: 'chemistry',
        description: 'NEET Chemistry',
        topics: [
          { name: 'Organic Chemistry', difficulty: 'Medium' },
          { name: 'Inorganic Chemistry', difficulty: 'Easy' },
          { name: 'Physical Chemistry', difficulty: 'Medium' },
          { name: 'Biomolecules', difficulty: 'Easy' },
        ]
      },
      {
        name: 'Biology',
        slug: 'biology',
        description: 'NEET Biology - Botany and Zoology',
        topics: [
          { name: 'Human Physiology', difficulty: 'Medium' },
          { name: 'Plant Physiology', difficulty: 'Medium' },
          { name: 'Genetics', difficulty: 'Hard' },
          { name: 'Ecology', difficulty: 'Easy' },
          { name: 'Cell Biology', difficulty: 'Medium' },
          { name: 'Biotechnology', difficulty: 'Medium' },
        ]
      }
    ]
  },
  'CAT': {
    subjects: [
      {
        name: 'Quantitative Aptitude',
        slug: 'quantitative-aptitude',
        description: 'CAT Quantitative Aptitude',
        topics: [
          { name: 'Arithmetic', difficulty: 'Medium' },
          { name: 'Algebra', difficulty: 'Medium' },
          { name: 'Geometry', difficulty: 'Hard' },
          { name: 'Number System', difficulty: 'Medium' },
          { name: 'Modern Math', difficulty: 'Hard' },
        ]
      },
      {
        name: 'Verbal Ability',
        slug: 'verbal-ability',
        description: 'CAT Verbal Ability & Reading Comprehension',
        topics: [
          { name: 'Reading Comprehension', difficulty: 'Medium' },
          { name: 'Para Jumbles', difficulty: 'Medium' },
          { name: 'Sentence Correction', difficulty: 'Easy' },
          { name: 'Critical Reasoning', difficulty: 'Hard' },
        ]
      },
      {
        name: 'Data Interpretation',
        slug: 'data-interpretation',
        description: 'CAT DILR Section',
        topics: [
          { name: 'Tables & Charts', difficulty: 'Medium' },
          { name: 'Logical Reasoning', difficulty: 'Hard' },
          { name: 'Puzzles', difficulty: 'Hard' },
          { name: 'Data Sufficiency', difficulty: 'Medium' },
        ]
      }
    ]
  },
  'GATE': {
    subjects: [
      {
        name: 'General Aptitude',
        slug: 'general-aptitude',
        description: 'GATE General Aptitude',
        topics: [
          { name: 'Verbal Ability', difficulty: 'Easy' },
          { name: 'Numerical Ability', difficulty: 'Medium' },
        ]
      },
      {
        name: 'Engineering Mathematics',
        slug: 'engineering-mathematics',
        description: 'GATE Engineering Mathematics',
        topics: [
          { name: 'Linear Algebra', difficulty: 'Medium' },
          { name: 'Calculus', difficulty: 'Medium' },
          { name: 'Differential Equations', difficulty: 'Hard' },
          { name: 'Probability & Statistics', difficulty: 'Medium' },
        ]
      },
      {
        name: 'Core Subject',
        slug: 'core-subject',
        description: 'GATE Core Engineering Subject',
        topics: [
          { name: 'Data Structures', difficulty: 'Hard' },
          { name: 'Algorithms', difficulty: 'Hard' },
          { name: 'Operating Systems', difficulty: 'Medium' },
          { name: 'Computer Networks', difficulty: 'Medium' },
          { name: 'Database Management', difficulty: 'Medium' },
        ]
      }
    ]
  },
  'UPSC': {
    subjects: [
      {
        name: 'General Studies',
        slug: 'general-studies',
        description: 'UPSC General Studies',
        topics: [
          { name: 'Indian Polity', difficulty: 'Medium' },
          { name: 'History', difficulty: 'Medium' },
          { name: 'Geography', difficulty: 'Medium' },
          { name: 'Economics', difficulty: 'Hard' },
          { name: 'Environment & Ecology', difficulty: 'Medium' },
          { name: 'Science & Technology', difficulty: 'Medium' },
        ]
      },
      {
        name: 'Current Affairs',
        slug: 'current-affairs',
        description: 'UPSC Current Affairs',
        topics: [
          { name: 'National Affairs', difficulty: 'Easy' },
          { name: 'International Relations', difficulty: 'Medium' },
          { name: 'Economy & Development', difficulty: 'Medium' },
        ]
      },
      {
        name: 'Essay & Ethics',
        slug: 'essay-ethics',
        description: 'UPSC Essay Writing & Ethics',
        topics: [
          { name: 'Essay Writing', difficulty: 'Medium' },
          { name: 'Ethics & Integrity', difficulty: 'Medium' },
          { name: 'Case Studies', difficulty: 'Hard' },
        ]
      }
    ]
  },
  'SSC': {
    subjects: [
      {
        name: 'General Intelligence',
        slug: 'general-intelligence',
        description: 'SSC General Intelligence & Reasoning',
        topics: [
          { name: 'Verbal Reasoning', difficulty: 'Medium' },
          { name: 'Non-Verbal Reasoning', difficulty: 'Medium' },
          { name: 'Analytical Reasoning', difficulty: 'Hard' },
        ]
      },
      {
        name: 'Quantitative Aptitude',
        slug: 'quantitative-aptitude',
        description: 'SSC Quantitative Aptitude',
        topics: [
          { name: 'Arithmetic', difficulty: 'Medium' },
          { name: 'Algebra', difficulty: 'Medium' },
          { name: 'Geometry', difficulty: 'Medium' },
        ]
      },
      {
        name: 'English',
        slug: 'english',
        description: 'SSC English Language',
        topics: [
          { name: 'Grammar', difficulty: 'Easy' },
          { name: 'Vocabulary', difficulty: 'Medium' },
          { name: 'Comprehension', difficulty: 'Medium' },
        ]
      },
      {
        name: 'General Awareness',
        slug: 'general-awareness',
        description: 'SSC General Awareness',
        topics: [
          { name: 'Current Affairs', difficulty: 'Easy' },
          { name: 'Static GK', difficulty: 'Medium' },
        ]
      }
    ]
  },
  'IBPS': {
    subjects: [
      {
        name: 'Reasoning Ability',
        slug: 'reasoning-ability',
        description: 'IBPS Reasoning Ability',
        topics: [
          { name: 'Verbal Reasoning', difficulty: 'Medium' },
          { name: 'Logical Reasoning', difficulty: 'Hard' },
          { name: 'Puzzles & Seating', difficulty: 'Hard' },
          { name: 'Data Sufficiency', difficulty: 'Medium' },
        ]
      },
      {
        name: 'Quantitative Aptitude',
        slug: 'quantitative-aptitude',
        description: 'IBPS Quantitative Aptitude',
        topics: [
          { name: 'Arithmetic', difficulty: 'Medium' },
          { name: 'Data Interpretation', difficulty: 'Hard' },
          { name: 'Number Series', difficulty: 'Medium' },
        ]
      },
      {
        name: 'English Language',
        slug: 'english-language',
        description: 'IBPS English Language',
        topics: [
          { name: 'Reading Comprehension', difficulty: 'Medium' },
          { name: 'Grammar', difficulty: 'Easy' },
          { name: 'Vocabulary', difficulty: 'Medium' },
        ]
      }
    ]
  },
  'GMAT': {
    subjects: [
      {
        name: 'Quantitative',
        slug: 'quantitative',
        description: 'GMAT Quantitative Section',
        topics: [
          { name: 'Problem Solving', difficulty: 'Hard' },
          { name: 'Data Sufficiency', difficulty: 'Hard' },
        ]
      },
      {
        name: 'Verbal',
        slug: 'verbal',
        description: 'GMAT Verbal Section',
        topics: [
          { name: 'Reading Comprehension', difficulty: 'Medium' },
          { name: 'Critical Reasoning', difficulty: 'Hard' },
          { name: 'Sentence Correction', difficulty: 'Medium' },
        ]
      },
      {
        name: 'Integrated Reasoning',
        slug: 'integrated-reasoning',
        description: 'GMAT Integrated Reasoning',
        topics: [
          { name: 'Multi-Source Reasoning', difficulty: 'Hard' },
          { name: 'Graphics Interpretation', difficulty: 'Medium' },
        ]
      }
    ]
  },
  'GRE': {
    subjects: [
      {
        name: 'Verbal Reasoning',
        slug: 'verbal-reasoning',
        description: 'GRE Verbal Reasoning',
        topics: [
          { name: 'Reading Comprehension', difficulty: 'Hard' },
          { name: 'Text Completion', difficulty: 'Medium' },
          { name: 'Sentence Equivalence', difficulty: 'Medium' },
        ]
      },
      {
        name: 'Quantitative Reasoning',
        slug: 'quantitative-reasoning',
        description: 'GRE Quantitative Reasoning',
        topics: [
          { name: 'Arithmetic', difficulty: 'Medium' },
          { name: 'Algebra', difficulty: 'Medium' },
          { name: 'Geometry', difficulty: 'Medium' },
          { name: 'Data Analysis', difficulty: 'Hard' },
        ]
      },
      {
        name: 'Analytical Writing',
        slug: 'analytical-writing',
        description: 'GRE Analytical Writing',
        topics: [
          { name: 'Issue Essay', difficulty: 'Hard' },
          { name: 'Argument Essay', difficulty: 'Hard' },
        ]
      }
    ]
  },
  'IELTS': {
    subjects: [
      {
        name: 'Listening',
        slug: 'listening',
        description: 'IELTS Listening',
        topics: [
          { name: 'Academic Listening', difficulty: 'Medium' },
          { name: 'General Training Listening', difficulty: 'Medium' },
        ]
      },
      {
        name: 'Reading',
        slug: 'reading',
        description: 'IELTS Reading',
        topics: [
          { name: 'Academic Reading', difficulty: 'Hard' },
          { name: 'General Training Reading', difficulty: 'Medium' },
        ]
      },
      {
        name: 'Writing',
        slug: 'writing',
        description: 'IELTS Writing',
        topics: [
          { name: 'Task 1', difficulty: 'Medium' },
          { name: 'Task 2', difficulty: 'Hard' },
        ]
      },
      {
        name: 'Speaking',
        slug: 'speaking',
        description: 'IELTS Speaking',
        topics: [
          { name: 'Part 1: Introduction', difficulty: 'Easy' },
          { name: 'Part 2: Long Turn', difficulty: 'Medium' },
          { name: 'Part 3: Discussion', difficulty: 'Hard' },
        ]
      }
    ]
  }
};

/**
 * Initialize database with subjects and topics if they don't exist
 * This runs automatically on server startup
 */
const initializeDatabase = async () => {
  try {
    // Check if subjects already exist
    const subjectCount = await Subject.countDocuments();
    
    if (subjectCount > 0) {
      console.log('📚 Database already initialized with subjects and topics');
      return;
    }

    console.log('🌱 Initializing database with subjects and topics...');

    let createdSubjects = 0;
    let createdTopics = 0;

    // Iterate through each exam
    for (const [examName, data] of Object.entries(examData)) {
      for (const subjectData of data.subjects) {
        // Create subject
        const subject = new Subject({
          name: subjectData.name,
          slug: subjectData.slug,
          description: subjectData.description,
          exam: examName,
          isActive: true
        });
        
        await subject.save({ validateBeforeSave: true });
        createdSubjects++;

        // Create topics for this subject
        for (const topicData of subjectData.topics) {
          const topic = new Topic({
            name: topicData.name,
            slug: generateSlug(topicData.name),
            exam: examName,
            subject: subject._id,
            subjectName: subject.name,
            difficulty: topicData.difficulty || 'Medium',
            isActive: true
          });
          
          await topic.save({ validateBeforeSave: true });
          createdTopics++;
        }
      }
    }

    console.log(`✅ Database initialized successfully!`);
    console.log(`   📖 Created ${createdSubjects} subjects`);
    console.log(`   📝 Created ${createdTopics} topics\n`);

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

module.exports = { initializeDatabase };
