
// Supabase Configuration (Secured via RLS Black Hole Policies)

// 1. Paste your Project URL inside the quotes below
const SUPABASE_URL = 'https://kehlmpwbrmsopdxsjsvc.supabase.co';

// 2. Paste your 'anon public' key inside the quotes below (starts with eyJh...)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlaGxtcHdicm1zb3BkeHNqc3ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjI1NDIsImV4cCI6MjA5MzAzODU0Mn0.Yl5uIfT98yZnsN_d7Po4_Pp3x_fVozMoGjsoVotva-w';

// 3. Initialize the connection so app.js can use it to upload
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

