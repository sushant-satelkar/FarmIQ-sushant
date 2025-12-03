const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'farmiQ.db');
const db = new sqlite3.Database(dbPath);

// Initialize database with users table
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table (updated schema - no username, aadhar, name)
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'farmer',
          phone TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
          return;
        }
        console.log('Users table created successfully');
      });

      // Create index on email for faster lookups
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_users_email 
        ON users (email)
      `, (err) => {
        if (err) {
          console.error('Error creating index:', err);
          reject(err);
          return;
        }
        console.log('Index created successfully');
      });

      // Create expert_consultancy table
      db.run(`
        CREATE TABLE IF NOT EXISTS expert_consultancy (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          full_name TEXT NOT NULL,
          initial TEXT NOT NULL,
          rating REAL NOT NULL,
          experience_years INTEGER NOT NULL,
          title TEXT NOT NULL,
          expertise_tags TEXT NOT NULL,
          consultation_count INTEGER NOT NULL,
          is_online INTEGER NOT NULL DEFAULT 1,
          chat_available INTEGER NOT NULL DEFAULT 1,
          call_available INTEGER NOT NULL DEFAULT 1,
          profile_image_url TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `, (err) => {
        if (err) {
          console.error('Error creating expert_consultancy table:', err);
        } else {
          console.log('Expert consultancy table created successfully');

          // Seed expert_consultancy table
          db.get('SELECT COUNT(*) as count FROM expert_consultancy', [], (err, row) => {
            if (err) {
              console.error('Error checking expert_consultancy:', err);
              return;
            }

            if (row.count === 0) {
              const experts = `
                INSERT INTO expert_consultancy
                (full_name, initial, rating, experience_years, title, expertise_tags, consultation_count, is_online, chat_available, call_available)
                VALUES
                ('Dr. Meera Joshi', 'M', 4.9, 15, 'Specialist', 'Crop Diseases,Pest Management,Organic Farming', 2150, 1, 1, 1),
                ('Rahul Deshmukh', 'R', 4.7, 12, 'Specialist', 'Soil Health,Fertilizers,Plant Nutrition', 1850, 1, 1, 1),
                ('Dr. Kavita Sharma', 'K', 4.8, 18, 'Specialist', 'Market Trends,Agri-Economics,Export', 2300, 1, 1, 1),
                ('Vikram Patil', 'V', 4.6, 10, 'Specialist', 'Irrigation Systems,Water Management', 1450, 1, 1, 1),
                ('Dr. Neha Kulkarni', 'N', 5.0, 22, 'Specialist', 'Crop Diseases,Plant Pathology,IPM', 2500, 1, 1, 1),
                ('Amit Kumar Singh', 'A', 4.5, 8, 'Specialist', 'Organic Farming,Sustainable Agriculture', 980, 1, 1, 1),
                ('Dr. Priya Reddy', 'P', 4.9, 16, 'Specialist', 'Soil Health,Micronutrients,Composting', 2100, 0, 1, 1),
                ('Sanjay Verma', 'S', 4.4, 7, 'Specialist', 'Pest Management,Biological Control', 850, 1, 1, 1),
                ('Dr. Anjali Mehta', 'A', 4.8, 20, 'Specialist', 'Market Trends,Price Forecasting,Policy', 2250, 1, 1, 1),
                ('Rajesh Nair', 'R', 4.6, 11, 'Specialist', 'Irrigation,Drip Systems,Water Conservation', 1560, 1, 1, 1),
                ('Dr. Sunita Rao', 'S', 4.9, 19, 'Specialist', 'Crop Diseases,Fungal Infections,Disease Management', 2180, 1, 1, 1),
                ('Karan Thakur', 'K', 4.3, 6, 'Specialist', 'Fertilizers,NPK Management,Soil Testing', 720, 0, 1, 1),
                ('Dr. Deepa Iyer', 'D', 4.7, 14, 'Specialist', 'Organic Farming,Certification,Marketing', 1780, 1, 1, 1),
                ('Manish Gupta', 'M', 4.5, 9, 'Specialist', 'Pest Management,Insect Control,Nematodes', 1120, 1, 1, 1),
                ('Dr. Rekha Pandey', 'R', 4.8, 17, 'Specialist', 'Soil Health,Soil Biology,Carbon Sequestration', 2050, 1, 1, 1),
                ('Arun Chawla', 'A', 4.4, 8, 'Specialist', 'Market Trends,Commodity Trading,Risk Management', 950, 1, 1, 1),
                ('Dr. Pooja Bhatt', 'P', 5.0, 25, 'Specialist', 'Crop Diseases,Viral Diseases,Resistance Breeding', 2450, 1, 1, 1),
                ('Suresh Yadav', 'S', 4.6, 10, 'Specialist', 'Irrigation,Sprinkler Systems,Fertigation', 1380, 0, 1, 1),
                ('Dr. Nisha Agarwal', 'N', 4.7, 13, 'Specialist', 'Fertilizers,Micronutrients,Foliar Application', 1650, 1, 1, 1),
                ('Vikas Malhotra', 'V', 4.5, 9, 'Specialist', 'Pest Management,Rodent Control,Storage Pests', 1050, 1, 1, 1)
              `;

              db.run(experts, (err) => {
                if (err) {
                  console.error('Error seeding expert_consultancy:', err);
                } else {
                  console.log('✓ Seeded expert_consultancy with 20 experts');
                }
              });
            } else {
              console.log(`Expert consultancy already has ${row.count} entries, skipping seed data`);
            }
          });
        }
      });

      resolve();
      // Create forum_posts table
      db.run(`
        CREATE TABLE IF NOT EXISTS forum_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          category TEXT NOT NULL,
          question TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) console.error('Error creating forum_posts table:', err);
      });

      // Create forum_replies table
      db.run(`
        CREATE TABLE IF NOT EXISTS forum_replies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          reply_text TEXT NOT NULL,
          replied_by TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (post_id) REFERENCES forum_posts(id)
        )
      `, (err) => {
        if (err) console.error('Error creating forum_replies table:', err);
        else {
          console.log('Forum replies table ready');

          // ALTER tables to add missing columns (handle errors gracefully)
          const alterStatements = [
            `ALTER TABLE forum_posts ADD COLUMN community TEXT`,
            `ALTER TABLE forum_posts ADD COLUMN extracted_keywords TEXT`,
            `ALTER TABLE forum_posts ADD COLUMN status TEXT DEFAULT 'Answered'`,
            `ALTER TABLE forum_posts ADD COLUMN upvotes INTEGER DEFAULT 0`,
            `ALTER TABLE forum_posts ADD COLUMN reply_count INTEGER DEFAULT 0`,
            `ALTER TABLE forum_replies ADD COLUMN upvotes INTEGER DEFAULT 0`
          ];

          alterStatements.forEach(stmt => {
            db.run(stmt, (err) => {
              // Ignore "duplicate column" errors
              if (err && !err.message.includes('duplicate column')) {
                console.error('Error altering table:', err.message);
              }
            });
          });

          // Check if forum_posts is empty, then insert seed data
          setTimeout(() => {
            db.get('SELECT COUNT(*) as count FROM forum_posts', [], (err, row) => {
              if (err) {
                console.error('Error checking forum_posts:', err);
                return;
              }

              if (row.count === 0) {
                console.log('Inserting forum seed data...');

                // INSERT realistic forum posts
                const insertPosts = `
                  INSERT INTO forum_posts
                  (id, user_id, category, community, question, extracted_keywords, status, upvotes, reply_count, created_at)
                  VALUES
                  (1, 1, 'Market', 'Market',
                   'What are the suggestions about selling tomatoes in the next two days?',
                   'tomatoes,market,price,selling,two days',
                   'Answered', 4, 1, '2025-02-01 10:00:00'),
                  
                  (2, 2, 'Disease & Pests', 'Disease & Pests',
                   'How can I control early blight disease in tomatoes?',
                   'tomatoes,early blight,fungus,disease,control',
                   'Answered', 10, 1, '2025-02-01 09:00:00'),
                  
                  (3, 3, 'Soil', 'Soil',
                   'My soil organic carbon is low. What should I add to improve it?',
                   'soil,organic carbon,FYM,compost,improve',
                   'Answered', 7, 1, '2025-01-31 18:30:00'),
                  
                  (4, 4, 'Weather', 'Weather',
                   'Heavy rain is forecast this week. How do I protect my standing paddy crop?',
                   'paddy,heavy rain,flooding,protection,drainage',
                   'Answered', 6, 2, '2025-01-31 15:20:00'),
                  
                  (5, 5, 'Fertilizers', 'Fertilizers',
                   'What is the recommended urea and DAP dose for wheat per acre?',
                   'wheat,urea,DAP,fertilizer dose,acre',
                   'Answered', 8, 1, '2025-01-30 11:45:00'),
                  
                  (6, 6, 'Crop', 'Crop',
                   'Which crop is best to grow in rabi season in Maharashtra with less water?',
                   'rabi,maharashtra,less water,chickpea,gram',
                   'Answered', 5, 1, '2025-01-29 17:10:00'),
                  
                  (7, 7, 'General Queries', 'General Queries',
                   'How can I get subsidy information for drip irrigation?',
                   'subsidy,drip irrigation,government scheme',
                   'Answered', 3, 1, '2025-01-28 14:00:00'),
                  
                  (8, 8, 'Disease & Pests', 'Disease & Pests',
                   'My cotton crop has whitefly infestation. What should I spray?',
                   'cotton,whitefly,insecticide,spray,infestation',
                   'Answered', 9, 1, '2025-01-27 08:30:00'),
                  
                  (9, 9, 'Market', 'Market',
                   'Will onion prices increase next month according to current trend?',
                   'onion,price,increase,market trend,next month',
                   'Answered', 6, 1, '2025-01-26 12:10:00'),
                  
                  (10, 10, 'Soil', 'Soil',
                   'Is it safe to use saline borewell water for irrigation in my farm?',
                   'saline water,EC,irrigation,safe,soil health',
                   'Answered', 4, 1, '2025-01-25 16:55:00')
                `;

                db.run(insertPosts, (err) => {
                  if (err) {
                    console.error('Error inserting forum posts:', err);
                  } else {
                    console.log('✓ Inserted 10 forum posts');

                    // INSERT matching replies
                    const insertReplies = `
                      INSERT INTO forum_replies
                      (id, post_id, reply_text, replied_by, upvotes, created_at)
                      VALUES
                      (1, 1,
                       'Market is expected to stay stable for the next two days. Focus on grading and selling only ripe tomatoes. Avoid distress selling at night and check nearby APMC rates before finalizing.',
                       'Expert Advisor – Market', 3, '2025-02-01 11:00:00'),
                      
                      (2, 2,
                       'For early blight in tomatoes, spray a fungicide containing Mancozeb or Chlorothalonil at 10–15 day intervals. Remove and destroy heavily infected leaves and avoid overhead irrigation.',
                       'Agriculture Officer – Plant Protection', 7, '2025-02-01 10:00:00'),
                      
                      (3, 3,
                       'To improve soil organic carbon, regularly add well decomposed FYM or compost (2–3 tons/acre) and practice crop rotation with legumes. Reduce excessive tillage.',
                       'Soil Scientist', 5, '2025-01-31 19:00:00'),
                      
                      (4, 4,
                       'For heavy rain forecast, clean field drains, make side channels to remove standing water quickly and strengthen bunds around paddy fields. Avoid applying urea just before the rain.',
                       'Senior Farmer Mentor', 4, '2025-01-31 16:00:00'),
                      
                      (5, 4,
                       'If waterlogging risk is very high, consider opening gaps in bunds at one side to drain excess water. Keep seedlings anchored by light earthing up.',
                       'Agriculture Officer – Irrigation', 3, '2025-01-31 16:30:00'),
                      
                      (6, 5,
                       'For wheat, a common recommendation is around 40–50 kg urea and 25–30 kg DAP per acre, applied in split doses depending on soil test. Always follow local soil test based recommendation.',
                       'Fertilizer Consultant', 6, '2025-01-30 12:30:00'),
                      
                      (7, 6,
                       'In low water conditions in Maharashtra rabi season, chickpea (gram) or lentil are good options. They require less irrigation compared to wheat or vegetables.',
                       'Crop Planning Expert', 4, '2025-01-29 18:00:00'),
                      
                      (8, 7,
                       'For drip irrigation subsidy, visit your local agriculture department office or MAHA DBT portal. Keep land ownership documents, Aadhar and bank details ready.',
                       'Government Scheme Advisor', 2, '2025-01-28 15:00:00'),
                      
                      (9, 8,
                       'For whitefly in cotton, use yellow sticky traps and spray recommended insecticides like Buprofezin or Imidacloprid as per label dose. Do not overuse one molecule to avoid resistance.',
                       'Plant Protection Expert', 8, '2025-01-27 09:30:00'),
                      
                      (10, 9,
                       'Onion prices may rise if arrivals decrease due to storage losses or export demand. Keep some stock in ventilated storage but avoid hoarding beyond your capacity.',
                       'Market Analyst', 5, '2025-01-26 13:00:00'),
                      
                      (11, 10,
                       'Saline water with very high EC is not safe. Get a water test done. If EC is borderline, you can use it with gypsum application and good drainage, but avoid for sensitive crops.',
                       'Soil & Water Scientist', 3, '2025-01-25 17:30:00')
                    `;

                    db.run(insertReplies, (err) => {
                      if (err) {
                        console.error('Error inserting forum replies:', err);
                      } else {
                        console.log('✓ Inserted 11 forum replies');

                        // Insert 15 MORE posts for better matching coverage
                        const insertMorePosts = `
                          INSERT INTO forum_posts
                          (id, user_id, category, community, question, extracted_keywords, status, upvotes, reply_count, created_at)
                          VALUES
                          (11, 1, 'Crop', 'Crop',
                           'What is the best variety of paddy rice for Punjab region?',
                           'paddy,rice,punjab,variety,best',
                           'Answered', 12, 1, '2025-01-24 09:15:00'),
                          
                          (12, 2, 'Soil', 'Soil',
                           'How to reduce salinity in agricultural land?',
                           'salinity,soil,reduce,gypsum,leaching',
                           'Answered', 14, 1, '2025-01-23 10:30:00'),
                          
                          (13, 3, 'Fertilizers', 'Fertilizers',
                           'Is vermicompost better than chemical fertilizers?',
                           'vermicompost,organic,chemical,fertilizer,comparison',
                           'Answered', 11, 1, '2025-01-22 14:20:00'),
                          
                          (14, 4, 'Disease & Pests', 'Disease & Pests',
                           'How to control stem borer in paddy crop naturally?',
                           'stem borer,paddy,natural,organic,control',
                           'Answered', 13, 1, '2025-01-21 11:45:00'),
                          
                          (15, 5, 'Market', 'Market',
                           'What is the minimum support price for wheat this year?',
                           'MSP,wheat,support price,government,procurement',
                           'Answered', 16, 1, '2025-01-20 13:00:00'),
                          
                          (16, 6, 'Weather', 'Weather',
                           'How to protect crops from frost damage in winter?',
                           'frost,winter,protection,crops,irrigation',
                           'Answered', 9, 1, '2025-01-19 08:00:00'),
                          
                          (17, 7, 'General Queries', 'General Queries',
                           'How to apply for Kisan Credit Card online?',
                           'KCC,credit card,farmer,loan,online application',
                           'Answered', 15, 1, '2025-01-18 16:30:00'),
                          
                          (18, 8, 'Crop', 'Crop',
                           'Best time to sow sugarcane in Maharashtra?',
                           'sugarcane,sowing,maharashtra,timing,planting',
                           'Answered', 10, 1, '2025-01-17 10:00:00'),
                          
                          (19, 9, 'Soil', 'Soil',
                           'What crops can grow in acidic soil with pH 5.5?',
                           'acidic soil,pH,crops,suitable,cultivation',
                           'Answered', 8, 1, '2025-01-16 12:45:00'),
                          
                          (20, 10, 'Disease & Pests', 'Disease & Pests',
                           'Yellowing of leaves in chili plants - what is the cause?',
                           'yellowing,chili,leaves,nitrogen,deficiency',
                           'Answered', 11, 1, '2025-01-15 09:30:00'),
                          
                          (21, 1, 'Market', 'Market',
                           'How to sell agricultural produce directly to consumers?',
                           'direct selling,farmers market,online,consumer',
                           'Answered', 7, 1, '2025-01-14 15:20:00'),
                          
                          (22, 2, 'Fertilizers', 'Fertilizers',
                           'What is the role of potassium in crop growth?',
                           'potassium,K,crop growth,deficiency,fertilizer',
                           'Answered', 12, 1, '2025-01-13 11:00:00'),
                          
                          (23, 3, 'General Queries', 'General Queries',
                           'How to get certification for organic farming?',
                           'organic,certification,NPOP,process,documents',
                           'Answered', 10, 1, '2025-01-12 14:00:00'),
                          
                          (24, 4, 'Crop', 'Crop',
                           'Which pulses give highest profit in kharif season?',
                           'pulses,kharif,profit,moong,urad',
                           'Answered', 13, 1, '2025-01-11 10:15:00'),
                          
                          (25, 5, 'Weather', 'Weather',
                           'Is hailstorm insurance available for farmers?',
                           'hailstorm,insurance,crop insurance,PMFBY,claim',
                           'Answered', 14, 1, '2025-01-10 13:30:00')
                        `;

                        db.run(insertMorePosts, (err) => {
                          if (err) {
                            console.error('Error inserting additional forum posts:', err);
                          } else {
                            console.log('✓ Inserted 15 additional forum posts (total 25)');

                            // Insert replies for additional posts
                            const insertMoreReplies = `
                              INSERT INTO forum_replies
                              (id, post_id, reply_text, replied_by, upvotes, created_at)
                              VALUES
                              (12, 11, 'Pusa Basmati 1509 and PR 126 are excellent varieties for Punjab. They give high yield (25-30 quintals/acre) and are disease resistant. Sow in June for best results.', 'Rice Expert – Punjab Agri Uni', 10, '2025-01-24 10:00:00'),
                              (13, 12, 'Apply gypsum @ 2-3 tons/acre and ensure good drainage. Grow salt-tolerant crops like barley initially. Deep plowing and organic matter addition help reduce salinity over time.', 'Soil Reclamation Specialist', 12, '2025-01-23 11:15:00'),
                              (14, 13, 'Vermicompost improves soil structure and provides slow-release nutrients. Chemical fertilizers give quick results but can degrade soil health long-term. Best approach is combining both.', 'Organic Farming Expert', 9, '2025-01-22 15:00:00'),
                              (15, 14, 'Use pheromone traps and encourage natural predators like spiders. Neem oil spray (5ml/liter) is effective. Avoid close planting and remove infected stems immediately.', 'IPM Specialist', 11, '2025-01-21 12:30:00'),
                              (16, 15, 'MSP for wheat 2024-25 is ₹2,275 per quintal. Government procures through FCI and state agencies. Register on eNAM or visit local procurement centers during rabi season.', 'Agricultural Marketing Expert', 14, '2025-01-20 14:00:00'),
                              (17, 16, 'Light irrigation before frost (evening) creates micro-climate protection. Use smoke or crop covers for valuable crops. Avoid nitrogen fertilizer before expected frost.', 'Climate Advisory Expert', 7, '2025-01-19 09:00:00'),
                              (18, 17, 'Visit PM-Kisan portal or your bank branch. Required documents: land records, Aadhar, passport photo. Loan limit based on cropping pattern, up to ₹3 lakh at 7% interest.', 'Banking Services Advisor', 13, '2025-01-18 17:15:00'),
                              (19, 18, 'October-November (Adsali) or February-March (Pre-seasonal). Adsali gives higher yield but needs more water. Ensure soil temperature above 20°C at planting.', 'Sugarcane Specialist', 8, '2025-01-17 11:00:00'),
                              (20, 19, 'Tea, coffee, pineapple, potato, and some pulses tolerate acidic soil. Add lime gradually to raise pH if needed. Blueberries thrive in acidic conditions.', 'Crop Advisor', 6, '2025-01-16 13:30:00'),
                              (21, 20, 'Yellowing indicates nitrogen deficiency or root disease. Apply urea @ 10g/plant or spray 19:19:19 NPK. Check for root rot - improve drainage if soil stays wet.', 'Plant Health Expert', 9, '2025-01-15 10:15:00'),
                              (22, 21, 'Join Farmer Producer Organizations (FPOs) or use platforms like AgroStar, DeHaat. Setup roadside stalls or participate in local haats. Online marketing gaining popularity.', 'Agri-Business Consultant', 5, '2025-01-14 16:00:00'),
                              (23, 22, 'Potassium improves disease resistance, water regulation, and fruit quality. Deficiency causes leaf edge browning. Apply muriate of potash (MOP) based on soil test.', 'Soil Nutrient Specialist', 10, '2025-01-13 12:00:00'),
                              (24, 23, 'Contact accredited certification agencies (India Organic, SGS, etc.). Maintain 3-year conversion records. Cost ₹10,000-50,000 depending on farm size. Government subsidies available.', 'Organic Certification Advisor', 8, '2025-01-12 15:00:00'),
                              (25, 24, 'Moong (green gram) gives good returns with 60-70 days duration. Urad (black gram) also profitable. Lower water requirement than cereals. Current market price ₹6,000-8,000/quintal.', 'Pulse Crop Expert', 11, '2025-01-11 11:00:00'),
                              (26, 25, 'Yes, Pradhan Mantri Fasal Bima Yojana (PMFBY) covers hailstorm. Premium 2% for kharif (1.5% rabi). Claim within 72 hours of damage. Take photos as evidence.', 'Crop Insurance Advisor', 12, '2025-01-10 14:30:00')
                            `;

                            db.run(insertMoreReplies, (err) => {
                              if (err) {
                                console.error('Error inserting additional replies:', err);
                              } else {
                                console.log('✓ Inserted 15 additional forum replies (total 26)');
                                console.log('✓ Complete forum seed data inserted! Total: 25 posts, 26 replies');
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                });
              } else {
                console.log(`Forum already has ${row.count} posts, skipping seed data`);
              }
            });
          }, 500); // Wait for ALTER statements to complete
        }
      });

      // Create farmer_forum table (new intelligent Q&A system)
      db.run(`
        CREATE TABLE IF NOT EXISTS farmer_forum (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question TEXT NOT NULL,
          highlighted_keywords TEXT,
          community TEXT NOT NULL,
          answer TEXT NOT NULL,
          expert_name TEXT NOT NULL,
          expert_role TEXT NOT NULL,
          upvotes INTEGER DEFAULT 0,
          replies INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating farmer_forum table:', err);
        } else {
          console.log('Farmer forum table created successfully');

          // Insert seed data (only if table is empty)
          db.get('SELECT COUNT(*) as count FROM farmer_forum', [], (err, row) => {
            if (err) {
              console.error('Error checking farmer_forum data:', err);
              return;
            }

            if (row.count === 0) {
              const seedData = [
                {
                  question: 'What is the best fertilizer for wheat crop during winter season?',
                  highlighted_keywords: 'fertilizer, wheat, winter',
                  community: 'Fertilizers',
                  answer: 'For wheat during winter, use NPK fertilizer (Nitrogen-Phosphorus-Potassium) in a 120:60:40 kg/ha ratio. Apply urea at tillering stage and top-dress with potassium. Ensure soil testing before application for best results.',
                  expert_name: 'Dr. Ramesh Sharma',
                  expert_role: 'Expert',
                  upvotes: 12,
                  replies: 3,
                  created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                  question: 'How to identify and control early blight disease in tomatoes?',
                  highlighted_keywords: 'early blight, disease, tomatoes',
                  community: 'Disease & Pests',
                  answer: 'Early blight shows dark brown spots with concentric rings on lower leaves. Control: Remove infected leaves, spray copper oxychloride 50% WP @ 3g/liter or Mancozeb 75% WP @ 2.5g/liter every 7-10 days. Ensure proper spacing and avoid overhead irrigation.',
                  expert_name: 'Agriculture Officer Priya Singh',
                  expert_role: 'Verified',
                  upvotes: 24,
                  replies: 5,
                  created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                  question: 'What are the current market rates for basmati rice in Delhi?',
                  highlighted_keywords: 'market rates, basmati rice, Delhi',
                  community: 'Market',
                  answer: 'Current basmati rice rates in Delhi APMC: Pusa Basmati ₹3,800-4,200/quintal, 1121 Basmati ₹4,500-5,000/quintal. Prices vary by quality grade. Check daily rates on eNAM portal for real-time updates.',
                  expert_name: 'Market Analyst Suresh Kumar',
                  expert_role: 'Expert',
                  upvotes: 8,
                  replies: 2,
                  created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                  question: 'How can I improve soil pH level for potato cultivation?',
                  highlighted_keywords: 'soil pH, potato, cultivation',
                  community: 'Soil',
                  answer: 'Potatoes prefer slightly acidic soil (pH 5.5-6.5). To lower pH: Add sulfur @ 200-300 kg/ha or organic compost. To raise pH: Apply lime @ 2-3 tons/ha. Test soil 3 months before planting. Split application is recommended for better results.',
                  expert_name: 'Soil Scientist Dr. Anjali Verma',
                  expert_role: 'Verified',
                  upvotes: 15,
                  replies: 4,
                  created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                  question: 'Which crops are most suitable for drip irrigation in semi-arid regions?',
                  highlighted_keywords: 'drip irrigation, semi-arid, crops',
                  community: 'Crop',
                  answer: 'Best crops for drip irrigation in semi-arid areas: Pomegranate, grapes, cotton, vegetables (tomato, capsicum, cucumber), and sugarcane. Drip irrigation saves 30-50% water and increases yield by 20-40%. Government subsidies available under PMKSY scheme.',
                  expert_name: 'Irrigation Expert Vikram Patel',
                  expert_role: 'Expert',
                  upvotes: 18,
                  replies: 6,
                  created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
                }
              ];

              const insertStmt = db.prepare(`
                INSERT INTO farmer_forum 
                (question, highlighted_keywords, community, answer, expert_name, expert_role, upvotes, replies, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `);

              seedData.forEach((data) => {
                insertStmt.run(
                  data.question,
                  data.highlighted_keywords,
                  data.community,
                  data.answer,
                  data.expert_name,
                  data.expert_role,
                  data.upvotes,
                  data.replies,
                  data.created_at
                );
              });

              insertStmt.finalize((err) => {
                if (err) {
                  console.error('Error inserting farmer_forum seed data:', err);
                } else {
                  console.log('Farmer forum seed data inserted successfully (5 entries)');
                }
              });
            } else {
              console.log(`Farmer forum already has ${row.count} entries, skipping seed data`);
            }
          });
        }
      });
    });
  });
};

// Database helper functions
const dbHelpers = {
  // Insert a new user (no username, aadhar, name)
  insertUser: (userData) => {
    return new Promise((resolve, reject) => {
      const { email, password_hash, role, phone } = userData;
      db.run(
        `INSERT INTO users (email, password_hash, role, phone) 
         VALUES (?, ?, ?, ?)`,
        [email, password_hash, role || 'farmer', phone || ''],
        function (err) {
          if (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
              reject(new Error('Email already exists'));
            } else {
              reject(err);
            }
            return;
          }
          resolve({ id: this.lastID });
        }
      );
    });
  },

  // Find user by role and email (for login)
  findUserByRoleAndEmail: (role, email) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM users WHERE role = ? AND email = ?`,
        [role, email],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  // Find user  by email only
  findUserByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM users WHERE email = ?`,
        [email],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  // Find user by ID
  findUserById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id, role, email, phone, created_at FROM users WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  // ========== PROFILE HELPERS ==========

  // Insert a new profile (no username, aadhar, village, district, state)
  insertProfile: (profileData) => {
    return new Promise((resolve, reject) => {
      const { id, full_name, email, phone_number, language_pref } = profileData;
      db.run(
        `INSERT INTO profiles (id, full_name, email, phone_number, language_pref) 
         VALUES (?, ?, ?, ?, ?)`,
        [id, full_name || '', email || '', phone_number || '', language_pref || 'en'],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id });
        }
      );
    });
  },

  // Find profile by user ID
  findProfileByUserId: (userId) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM profiles WHERE id = ?`,
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  // Update profile (no username, aadhar, village, district, state)
  updateProfile: (userId, profileData) => {
    return new Promise((resolve, reject) => {
      const { full_name, phone_number, language_pref } = profileData;
      db.run(
        `UPDATE profiles 
         SET full_name = ?, phone_number = ?, language_pref = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [full_name, phone_number, language_pref, userId],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // ========== NGO SCHEMES HELPERS ==========

  // Get all NGO schemes
  getNgoSchemes: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM ngo_schemes ORDER BY created_at DESC`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows || []);
        }
      );
    });
  },

  // Get NGO scheme by ID
  getNgoSchemeById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM ngo_schemes WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  // Create NGO scheme
  createNgoScheme: (data) => {
    return new Promise((resolve, reject) => {
      const { name, ministry, deadline, location, contact_number, no_of_docs_required, status, benefit_text, eligibility_text } = data;
      db.run(
        `INSERT INTO ngo_schemes (name, ministry, deadline, location, contact_number, no_of_docs_required, status, benefit_text, eligibility_text)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, ministry || '', deadline || '', location || '', contact_number || '', no_of_docs_required || 0, status || 'active', benefit_text || '', eligibility_text || ''],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id: this.lastID });
        }
      );
    });
  },

  // Update NGO scheme
  updateNgoScheme: (id, data) => {
    return new Promise((resolve, reject) => {
      const { name, ministry, deadline, location, contact_number, no_of_docs_required, status, benefit_text, eligibility_text } = data;
      db.run(
        `UPDATE ngo_schemes 
         SET name = ?, ministry = ?, deadline = ?, location = ?, contact_number = ?, 
             no_of_docs_required = ?, status = ?, benefit_text = ?, eligibility_text = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
        [name, ministry, deadline, location, contact_number, no_of_docs_required, status, benefit_text, eligibility_text, id],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // Delete NGO scheme
  deleteNgoScheme: (id) => {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM ngo_schemes WHERE id = ?`,
        [id],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // ========== SOIL LAB HELPERS ==========

  // Get all soil labs
  getSoilLabs: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM soil_lab ORDER BY created_at DESC`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows || []);
        }
      );
    });
  },

  // Get soil lab by ID
  getSoilLabById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM soil_lab WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  // Create soil lab
  createSoilLab: (data) => {
    return new Promise((resolve, reject) => {
      const { name, location, contact_number, price, rating, tag } = data;
      db.run(
        `INSERT INTO soil_lab (name, location, contact_number, price, rating, tag)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, location || '', contact_number || '', price || 0, rating || 0, tag || ''],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id: this.lastID });
        }
      );
    });
  },

  // Update soil lab
  updateSoilLab: (id, data) => {
    return new Promise((resolve, reject) => {
      const { name, location, contact_number, price, rating, tag } = data;
      db.run(
        `UPDATE soil_lab 
         SET name = ?, location = ?, contact_number = ?, price = ?, rating = ?, tag = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
        [name, location, contact_number, price, rating, tag, id],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // Delete soil lab
  deleteSoilLab: (id) => {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM soil_lab WHERE id = ?`,
        [id],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // ========== CROP HISTORY HELPERS ==========

  // Get crops by user ID (for farmers)
  getCropsByUserId: (userId) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM crop_history WHERE user_id = ? ORDER BY created_at DESC`,
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows || []);
        }
      );
    });
  },

  // Get all crops (for admins)
  getAllCrops: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM crop_history ORDER BY created_at DESC`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows || []);
        }
      );
    });
  },

  // Get crop by ID
  getCropById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM crop_history WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  },

  // Create crop (user_id from server, never from client)
  createCrop: (userId, data) => {
    return new Promise((resolve, reject) => {
      const { crop_name, crop_price, selling_price, crop_produced_kg } = data;
      db.run(
        `INSERT INTO crop_history (user_id, crop_name, crop_price, selling_price, crop_produced_kg)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, crop_name, crop_price || 0, selling_price || 0, crop_produced_kg || 0],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id: this.lastID });
        }
      );
    });
  },

  // Update crop
  updateCrop: (id, data) => {
    return new Promise((resolve, reject) => {
      const { crop_name, crop_price, selling_price, crop_produced_kg } = data;
      db.run(
        `UPDATE crop_history 
         SET crop_name = ?, crop_price = ?, selling_price = ?, crop_produced_kg = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
        [crop_name, crop_price, selling_price, crop_produced_kg, id],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // Delete crop
  deleteCrop: (id) => {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM crop_history WHERE id = ?`,
        [id],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // Get all farmers
  getFarmers: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT p.id, p.full_name as name, p.email, p.phone_number as mobile,
                p.crops_grown, p.available_quantity, p.location, p.expected_price
         FROM profiles p
         JOIN users u ON p.id = u.id
         WHERE u.role = 'farmer'`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows || []);
        }
      );
    });
  },
  // ========== FORUM HELPERS ==========

  // Get all forum posts with replies
  getForumPosts: () => {
    return new Promise((resolve, reject) => {
      // First get all posts with new fields
      db.all(
        `SELECT fp.id, fp.user_id, fp.category, fp.community, fp.question, fp.extracted_keywords,
                fp.status, fp.upvotes, fp.reply_count, fp.created_at, p.full_name as farmer_name
         FROM forum_posts fp
         LEFT JOIN profiles p ON fp.user_id = p.id
         ORDER BY fp.created_at DESC`,
        [],
        (err, posts) => {
          if (err) {
            reject(err);
            return;
          }

          if (!posts || posts.length === 0) {
            resolve([]);
            return;
          }

          // Then get all replies
          db.all(
            `SELECT * FROM forum_replies ORDER BY created_at ASC`,
            [],
            (err, replies) => {
              if (err) {
                reject(err);
                return;
              }

              // Map replies to posts
              const postsWithReplies = posts.map(post => {
                return {
                  ...post,
                  replies: replies.filter(reply => reply.post_id === post.id)
                };
              });

              resolve(postsWithReplies);
            }
          );
        }
      );
    });
  },

  // Create forum post
  createForumPost: (userId, category, question, community, extractedKeywords) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO forum_posts (user_id, category, community, question, extracted_keywords, status, upvotes, reply_count) 
         VALUES (?, ?, ?, ?, ?, 'Unanswered', 0, 0)`,
        [userId, category, community || category, question, extractedKeywords || ''],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id: this.lastID });
        }
      );
    });
  },

  // Create forum reply
  createForumReply: (postId, replyText, repliedBy) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO forum_replies (post_id, reply_text, replied_by, upvotes) VALUES (?, ?, ?, 0)`,
        [postId, replyText, repliedBy],
        function (err) {
          if (err) {
            reject(err);
            return;
          }

          // Increment reply_count in forum_posts
          db.run(
            `UPDATE forum_posts SET reply_count = reply_count + 1 WHERE id = ?`,
            [postId],
            (updateErr) => {
              if (updateErr) console.error('Error updating reply_count:', updateErr);
            }
          );

          resolve({ id: this.lastID });
        }
      );
    });
  },

  // Increment post upvotes
  incrementPostUpvotes: (postId) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE forum_posts SET upvotes = upvotes + 1 WHERE id = ?`,
        [postId],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          // Get updated count
          db.get(`SELECT upvotes FROM forum_posts WHERE id = ?`, [postId], (err, row) => {
            if (err) reject(err);
            else resolve({ upvotes: row?.upvotes || 0 });
          });
        }
      );
    });
  },

  // Decrement post upvotes
  decrementPostUpvotes: (postId) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE forum_posts SET upvotes = upvotes - 1 WHERE id = ?`,
        [postId],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          // Get updated count
          db.get(`SELECT upvotes FROM forum_posts WHERE id = ?`, [postId], (err, row) => {
            if (err) reject(err);
            else resolve({ upvotes: row?.upvotes || 0 });
          });
        }
      );
    });
  },

  // ========== FARMER FORUM HELPERS (Intelligent Q&A System) ==========

  // Get all farmer forum posts
  getFarmerForumPosts: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM farmer_forum ORDER BY created_at DESC`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows || []);
        }
      );
    });
  },

  // Search farmer forum by keywords and community with intelligent ranking
  searchFarmerForumByKeywords: (keywords, community) => {
    return new Promise((resolve, reject) => {
      // Build the query to match keywords and community
      const keywordArray = keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);

      if (keywordArray.length === 0) {
        // No keywords, just filter by community if provided
        const query = community
          ? `SELECT * FROM farmer_forum WHERE community = ? ORDER BY created_at DESC LIMIT 10`
          : `SELECT * FROM farmer_forum ORDER BY created_at DESC LIMIT 10`;
        const params = community ? [community] : [];

        db.all(query, params, (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows || []);
        });
        return;
      }

      // Get all posts from the specified community (or all if no community)
      const query = community
        ? `SELECT * FROM farmer_forum WHERE community = ?`
        : `SELECT * FROM farmer_forum`;
      const params = community ? [community] : [];

      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        if (!rows || rows.length === 0) {
          resolve([]);
          return;
        }

        // Rank posts by keyword matching
        const rankedPosts = rows.map(post => {
          const postKeywords = (post.highlighted_keywords || '').toLowerCase();
          const postQuestion = (post.question || '').toLowerCase();
          const postAnswer = (post.answer || '').toLowerCase();

          let matchScore = 0;
          keywordArray.forEach(keyword => {
            if (postKeywords.includes(keyword)) matchScore += 3; // Keywords match is most important
            if (postQuestion.includes(keyword)) matchScore += 2;
            if (postAnswer.includes(keyword)) matchScore += 1;
          });

          return {
            ...post,
            matchScore
          };
        });

        // Sort by match score (descending), then by recency
        rankedPosts.sort((a, b) => {
          if (b.matchScore !== a.matchScore) {
            return b.matchScore - a.matchScore;
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        // Return top 10 results
        const topResults = rankedPosts.slice(0, 10);

        // Remove matchScore before returning
        const cleanResults = topResults.map(({ matchScore, ...post }) => post);

        resolve(cleanResults);
      });
    });
  },

  // Create farmer forum question (used when no match found)
  createFarmerForumQuestion: (question, keywords, community, userId) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO farmer_forum (question, highlighted_keywords, community, answer, expert_name, expert_role, upvotes, replies)
         VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
        [
          question,
          keywords,
          community,
          'Your question has been posted. An expert will respond shortly.',
          'FarmIQ Assistant',
          'Verified',
        ],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ id: this.lastID });
        }
      );
    });
  },

  // Increment upvotes
  incrementForumUpvotes: (postId) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE farmer_forum SET upvotes = upvotes + 1 WHERE id = ?`,
        [postId],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          // Get the new upvote count
          db.get(
            `SELECT upvotes FROM farmer_forum WHERE id = ?`,
            [postId],
            (err, row) => {
              if (err) {
                reject(err);
                return;
              }
              resolve({ upvotes: row ? row.upvotes : 0 });
            }
          );
        }
      );
    });
  },

  // Decrement upvotes
  decrementForumUpvotes: (postId) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE farmer_forum SET upvotes = upvotes - 1 WHERE id = ?`,
        [postId],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          // Get the new upvote count
          db.get(
            `SELECT upvotes FROM farmer_forum WHERE id = ?`,
            [postId],
            (err, row) => {
              if (err) {
                reject(err);
                return;
              }
              resolve({ upvotes: row ? row.upvotes : 0 });
            }
          );
        }
      );
    });
  },

  // Increment replies count
  incrementForumReplies: (postId) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE farmer_forum SET replies = replies + 1 WHERE id = ?`,
        [postId],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // Get farmer forum post by ID
  getFarmerForumPostById: (postId) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM farmer_forum WHERE id = ?`,
        [postId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row);
        }
      );
    });
  }
};


module.exports = {
  db,
  initDatabase,
  dbHelpers
};
