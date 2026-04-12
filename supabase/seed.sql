-- Pathologies neuromusculaires de référence
insert into public.pathologies (code, name, description) values
  ('PSH',       'Paraparésie spastique héréditaire', 'Groupe de maladies génétiques caractérisées par une spasticité progressive des membres inférieurs.'),
  ('SEP',       'Sclérose en plaques',                'Maladie auto-immune du système nerveux central.'),
  ('SLA',       'Sclérose latérale amyotrophique',    'Maladie neurodégénérative affectant les motoneurones.'),
  ('MYOPATHIE', 'Myopathies',                         'Maladies des muscles : dystrophies musculaires, myopathies congénitales, etc.'),
  ('CMT',       'Maladie de Charcot-Marie-Tooth',     'Neuropathies périphériques héréditaires.'),
  ('AMS',       'Atrophie musculaire spinale',        'Maladie génétique affectant les motoneurones.'),
  ('PARKINSON', 'Maladie de Parkinson',               'Maladie neurodégénérative avec troubles moteurs.'),
  ('GENERAL',   'Général neuromusculaire',            'Exercices utiles à plusieurs pathologies neuromusculaires.')
on conflict (code) do nothing;

-- Note : les exercices de démonstration seront créés par un compte kiné
-- depuis l'application (upload des vidéos). Le seed ne crée pas d'exercices
-- car ils référencent un profil kiné (created_by) via auth.users.
