/*
# StudyForge AI - Core Schema

## Overview
Creates the full data model for StudyForge AI: documents (uploaded study material),
quizzes, flashcards, simplified explanations, and quiz attempt records. Seeds two
sample documents (Photosynthesis, Newton's Laws) with pre-generated study kits and
quiz attempts so the app looks populated on first load.

## Tables
1. `documents` - uploaded notes (title, tag, raw text, difficulty, created_at)
2. `quizzes` - one per document, stores questions as JSON array
3. `flashcards` - one per document, stores cards as JSON array
4. `explanations` - one per document, simplified text + level
5. `quiz_attempts` - score records for progress dashboard

## Security
- Single-tenant app (no sign-in). RLS enabled on all tables.
- Policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because all data is intentionally shared/public (no user isolation needed).

## Seed Data
- "Photosynthesis Basics" (Biology) - 6 quiz questions, 8 flashcards, explanation, 4 attempts
- "Newton's Laws of Motion" (Physics) - 6 quiz questions, 8 flashcards, explanation, 4 attempts
*/

-- ===== DOCUMENTS =====
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  tag text NOT NULL DEFAULT 'General',
  raw_text text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_documents" ON documents;
CREATE POLICY "anon_select_documents" ON documents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_documents" ON documents;
CREATE POLICY "anon_insert_documents" ON documents FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_documents" ON documents;
CREATE POLICY "anon_update_documents" ON documents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_documents" ON documents;
CREATE POLICY "anon_delete_documents" ON documents FOR DELETE TO anon, authenticated USING (true);

-- ===== QUIZZES =====
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_quizzes" ON quizzes;
CREATE POLICY "anon_select_quizzes" ON quizzes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_quizzes" ON quizzes;
CREATE POLICY "anon_insert_quizzes" ON quizzes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_quizzes" ON quizzes;
CREATE POLICY "anon_update_quizzes" ON quizzes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_quizzes" ON quizzes;
CREATE POLICY "anon_delete_quizzes" ON quizzes FOR DELETE TO anon, authenticated USING (true);

-- ===== FLASHCARDS =====
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  cards jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_flashcards" ON flashcards;
CREATE POLICY "anon_select_flashcards" ON flashcards FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_flashcards" ON flashcards;
CREATE POLICY "anon_insert_flashcards" ON flashcards FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_flashcards" ON flashcards;
CREATE POLICY "anon_update_flashcards" ON flashcards FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_flashcards" ON flashcards;
CREATE POLICY "anon_delete_flashcards" ON flashcards FOR DELETE TO anon, authenticated USING (true);

-- ===== EXPLANATIONS =====
CREATE TABLE IF NOT EXISTS explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  simplified_text text NOT NULL DEFAULT '',
  level text NOT NULL DEFAULT 'standard' CHECK (level IN ('eli5', 'standard', 'professor')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE explanations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_explanations" ON explanations;
CREATE POLICY "anon_select_explanations" ON explanations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_explanations" ON explanations;
CREATE POLICY "anon_insert_explanations" ON explanations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_explanations" ON explanations;
CREATE POLICY "anon_update_explanations" ON explanations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_explanations" ON explanations;
CREATE POLICY "anon_delete_explanations" ON explanations FOR DELETE TO anon, authenticated USING (true);

-- ===== QUIZ ATTEMPTS =====
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_quiz_attempts" ON quiz_attempts;
CREATE POLICY "anon_select_quiz_attempts" ON quiz_attempts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_quiz_attempts" ON quiz_attempts;
CREATE POLICY "anon_insert_quiz_attempts" ON quiz_attempts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_quiz_attempts" ON quiz_attempts;
CREATE POLICY "anon_update_quiz_attempts" ON quiz_attempts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_quiz_attempts" ON quiz_attempts;
CREATE POLICY "anon_delete_quiz_attempts" ON quiz_attempts FOR DELETE TO anon, authenticated USING (true);

-- ===== SEED DATA =====
-- Only insert if documents table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM documents LIMIT 1) THEN
    -- Document 1: Photosynthesis
    INSERT INTO documents (id, title, tag, raw_text, difficulty, created_at) VALUES
      ('a0000000-0000-0000-0000-000000000001', 'Photosynthesis Basics', 'Biology',
       'Photosynthesis is the process by which plants, algae, and some bacteria convert light energy into chemical energy stored in glucose. The process occurs in the chloroplasts, which contain the green pigment chlorophyll. Chlorophyll absorbs light primarily in the blue and red wavelengths and reflects green light, which is why plants appear green. The overall equation for photosynthesis is: 6CO2 + 6H2O + light energy -> C6H12O6 + 6O2. Photosynthesis has two main stages: the light-dependent reactions and the light-independent reactions (Calvin cycle). The light-dependent reactions take place in the thylakoid membranes of the chloroplast. In these reactions, light energy is used to split water molecules, producing oxygen, ATP, and NADPH. This process is called photolysis. The Calvin cycle takes place in the stroma of the chloroplast. It uses the ATP and NADPH produced in the light-dependent reactions to fix carbon dioxide into glucose through a series of enzyme-catalyzed steps. The key enzyme involved is RuBisCO (ribulose-1,5-bisphosphate carboxylase/oxygenase). Factors affecting the rate of photosynthesis include light intensity, carbon dioxide concentration, temperature, and water availability. At high light intensities, the rate plateaus because another factor becomes limiting. Similarly, very high temperatures can denature the enzymes involved in the process.',
       'medium', now() - interval '7 days');

    INSERT INTO quizzes (document_id, questions) VALUES
      ('a0000000-0000-0000-0000-000000000001', '[
        {"question":"What is the primary pigment involved in photosynthesis?","options":["Chlorophyll","Carotene","Xanthophyll","Anthocyanin"],"correct_index":0,"explanation":"Chlorophyll is the green pigment in chloroplasts that absorbs light energy for photosynthesis."},
        {"question":"Where do the light-dependent reactions take place?","options":["Stroma","Thylakoid membranes","Matrix","Cytoplasm"],"correct_index":1,"explanation":"The light-dependent reactions occur in the thylakoid membranes, where water is split and ATP/NADPH are produced."},
        {"question":"What is the overall equation for photosynthesis?","options":["6CO2 + 6H2O + light -> C6H12O6 + 6O2","6CO2 + 12H2O -> C6H12O6 + 6O2 + 6H2O","C6H12O6 + 6O2 -> 6CO2 + 6H2O","CO2 + H2O -> CH2O + O2"],"correct_index":0,"explanation":"The balanced equation is 6CO2 + 6H2O + light energy -> C6H12O6 + 6O2."},
        {"question":"What is produced during the light-dependent reactions?","options":["Glucose and oxygen","ATP, NADPH, and oxygen","Glucose and CO2","ATP and CO2"],"correct_index":1,"explanation":"The light-dependent reactions produce ATP, NADPH, and oxygen (from the splitting of water)."},
        {"question":"Where does the Calvin cycle take place?","options":["Thylakoid membrane","Stroma","Nucleus","Mitochondria"],"correct_index":1,"explanation":"The Calvin cycle occurs in the stroma of the chloroplast, using ATP and NADPH to fix CO2 into glucose."},
        {"question":"What is the role of RuBisCO?","options":["It splits water molecules","It transports electrons","It fixes carbon dioxide in the Calvin cycle","It absorbs light energy"],"correct_index":2,"explanation":"RuBisCO is the enzyme that catalyzes the fixation of CO2 in the Calvin cycle."}
      ]'::jsonb);

    INSERT INTO flashcards (document_id, cards) VALUES
      ('a0000000-0000-0000-0000-000000000001', '[
        {"front":"What is photosynthesis?","back":"The process by which plants, algae, and some bacteria convert light energy into chemical energy stored in glucose.","status":"learning"},
        {"front":"What pigment is responsible for absorbing light in photosynthesis?","back":"Chlorophyll, found in the chloroplasts.","status":"learning"},
        {"front":"Why do plants appear green?","back":"Chlorophyll absorbs blue and red light but reflects green light.","status":"known"},
        {"front":"What are the two main stages of photosynthesis?","back":"The light-dependent reactions and the light-independent reactions (Calvin cycle).","status":"learning"},
        {"front":"Where do light-dependent reactions occur?","back":"In the thylakoid membranes of the chloroplast.","status":"learning"},
        {"front":"What is photolysis?","back":"The splitting of water molecules using light energy, producing oxygen, ATP, and NADPH.","status":"learning"},
        {"front":"Where does the Calvin cycle take place?","back":"In the stroma of the chloroplast.","status":"known"},
        {"front":"What does RuBisCO do?","back":"It is the enzyme that fixes carbon dioxide during the Calvin cycle.","status":"learning"}
      ]'::jsonb);

    INSERT INTO explanations (document_id, simplified_text, level) VALUES
      ('a0000000-0000-0000-0000-000000000001',
       'Photosynthesis is how plants make their own food. Imagine a plant as a tiny solar-powered factory: the leaves are the solar panels, catching sunlight, and the roots deliver water. Inside the leaves, in tiny structures called chloroplasts, a green pigment called chlorophyll grabs the light energy.\n\nThe plant uses this light energy to take carbon dioxide from the air and water from the soil and stitch them together into glucose — a type of sugar that the plant uses for energy and growth. As a bonus, the plant releases oxygen into the air as a byproduct, which is what we breathe.\\n\nThe process happens in two stages. First, the light-dependent reactions capture the sunlight and split water molecules, producing oxygen and two energy-carrying molecules called ATP and NADPH. Then, the Calvin cycle uses that stored energy to build glucose from carbon dioxide. The key player here is an enzyme called RuBisCO, which acts like a molecular machine that grabs CO2 and feeds it into the sugar-building assembly line.\n\nSeveral things can speed up or slow down this factory: how much light is available, how much CO2 is in the air, the temperature, and how much water the plant has. If any one of these runs low, the whole process slows down, even if the others are plentiful.',
       'standard');

    INSERT INTO quiz_attempts (document_id, score, total_questions, attempted_at) VALUES
      ('a0000000-0000-0000-0000-000000000001', 3, 6, now() - interval '6 days'),
      ('a0000000-0000-0000-0000-000000000001', 4, 6, now() - interval '4 days'),
      ('a0000000-0000-0000-0000-000000000001', 5, 6, now() - interval '2 days'),
      ('a0000000-0000-0000-0000-000000000001', 6, 6, now() - interval '1 day');

    -- Document 2: Newton's Laws
    INSERT INTO documents (id, title, tag, raw_text, difficulty, created_at) VALUES
      ('a0000000-0000-0000-0000-000000000002', 'Newton''s Laws of Motion', 'Physics',
       'Newton''s three laws of motion form the foundation of classical mechanics. The First Law, also known as the law of inertia, states that an object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force. This means objects naturally resist changes to their state of motion. The Second Law states that the acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. This is expressed as the famous equation F = ma, where F is force, m is mass, and a is acceleration. The unit of force is the Newton (N), which is equivalent to kg*m/s^2. The Third Law states that for every action, there is an equal and opposite reaction. This means that forces always occur in pairs — when one object exerts a force on another, the second object exerts an equal and opposite force back on the first. Examples include a rocket expelling gas downward to move upward, or a person walking by pushing back on the ground. Friction is a force that opposes motion and it comes in two types: static friction (prevents an object from starting to move) and kinetic friction (opposes an object already in motion). The coefficient of friction depends on the materials in contact. Mass is a measure of the amount of matter in an object, while weight is the force of gravity acting on that mass (W = mg, where g is approximately 9.8 m/s^2 on Earth).',
       'medium', now() - interval '5 days');

    INSERT INTO quizzes (document_id, questions) VALUES
      ('a0000000-0000-0000-0000-000000000002', '[
        {"question":"What is Newton''s First Law also known as?","options":["Law of gravity","Law of inertia","Law of acceleration","Law of reaction"],"correct_index":1,"explanation":"The First Law is called the law of inertia because it describes how objects resist changes to their motion."},
        {"question":"What does F = ma represent?","options":["Newton''s First Law","Newton''s Second Law","Newton''s Third Law","The law of friction"],"correct_index":1,"explanation":"F = ma is Newton''s Second Law: force equals mass times acceleration."},
        {"question":"What is the SI unit of force?","options":["Joule","Watt","Newton","Pascal"],"correct_index":2,"explanation":"The Newton (N) is the SI unit of force, equivalent to kg*m/s^2."},
        {"question":"Newton''s Third Law states that for every action there is...","options":["a greater reaction","an equal and opposite reaction","no reaction","a smaller reaction"],"correct_index":1,"explanation":"The Third Law says forces always come in equal and opposite pairs."},
        {"question":"Which type of friction prevents an object from starting to move?","options":["Kinetic friction","Static friction","Rolling friction","Fluid friction"],"correct_index":1,"explanation":"Static friction prevents an object from beginning to move when a force is applied."},
        {"question":"What is the difference between mass and weight?","options":["They are the same thing","Mass is the amount of matter; weight is the force of gravity on that mass","Mass changes with location; weight does not","Weight is measured in kilograms"],"correct_index":1,"explanation":"Mass is the quantity of matter (constant), while weight is the gravitational force on that mass (W = mg)."}
      ]'::jsonb);

    INSERT INTO flashcards (document_id, cards) VALUES
      ('a0000000-0000-0000-0000-000000000002', '[
        {"front":"What does Newton''s First Law state?","back":"An object at rest stays at rest and an object in motion stays in motion unless acted on by an unbalanced force (law of inertia).","status":"learning"},
        {"front":"What is the equation for Newton''s Second Law?","back":"F = ma (force equals mass times acceleration).","status":"known"},
        {"front":"What is the SI unit of force?","back":"The Newton (N), equivalent to kg*m/s^2.","status":"learning"},
        {"front":"What does Newton''s Third Law state?","back":"For every action, there is an equal and opposite reaction.","status":"known"},
        {"front":"What is the difference between static and kinetic friction?","back":"Static friction prevents motion from starting; kinetic friction opposes an object already in motion.","status":"learning"},
        {"front":"What is the value of g on Earth?","back":"Approximately 9.8 m/s^2.","status":"learning"},
        {"front":"What is the difference between mass and weight?","back":"Mass is the amount of matter (constant); weight is the force of gravity on that mass (W = mg).","status":"learning"},
        {"front":"Give an example of Newton''s Third Law in action.","back":"A rocket expels gas downward to propel itself upward; walking pushes back on the ground to move forward.","status":"learning"}
      ]'::jsonb);

    INSERT INTO explanations (document_id, simplified_text, level) VALUES
      ('a0000000-0000-0000-0000-000000000002',
       'Newton''s three laws of motion are the rules that describe how things move. Think of them as the instruction manual for the universe''s moving parts.\n\nThe First Law (the law of inertia) says that things are lazy — they want to keep doing whatever they''re already doing. A ball sitting on the ground stays put until you kick it. A ball rolling on the ground keeps rolling until something (like friction) slows it down. This resistance to change is called inertia, and heavier objects have more of it.\n\nThe Second Law is the most practical one: it tells you exactly how much force you need to make something accelerate. The formula is F = ma. If you push a shopping cart, it accelerates based on how hard you push (force) and how heavy the cart is (mass). Double the force and you double the acceleration; double the mass and you halve the acceleration. The unit of force is called the Newton.\n\nThe Third Law is about give and take: every push has an equal and opposite push back. When you jump off a boat, you push the boat backward as you go forward. A rocket works the same way — it throws gas downward and the reaction pushes it upward.\n\nTwo important related concepts: friction is the force that fights against motion (static friction stops things from starting to move, kinetic friction slows things already moving), and mass is different from weight — mass is how much stuff is in an object, while weight is how hard gravity pulls on that stuff.',
       'standard');

    INSERT INTO quiz_attempts (document_id, score, total_questions, attempted_at) VALUES
      ('a0000000-0000-0000-0000-000000000002', 2, 6, now() - interval '5 days'),
      ('a0000000-0000-0000-0000-000000000002', 4, 6, now() - interval '3 days'),
      ('a0000000-0000-0000-0000-000000000002', 5, 6, now() - interval '1 day');
  END IF;
END $$;