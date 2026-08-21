import { createClient } from '@supabase/supabase-js'

const url = 'https://rygtyzwkhcuiwxzqmmlo.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5Z3R5endraGN1aXd4enFtbWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzE5NjcsImV4cCI6MjA5ODY0Nzk2N30.wbG8zerewUJae0nMldQYbHJheE0yp1gnyjFBp5BqpdQ'

const supabase = createClient(url, serviceKey)

const email = 'vikramtomar0505@gmail.com'
const password = 'qwerty123'

async function run() {
  console.log(`Setting up super admin in Supabase for ${email}...`)
  
  // Sign up
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Vikram Tomar',
        role: 'superadmin',
      },
    },
  })

  if (signUpErr) {
    console.log('SignUp result:', signUpErr.message)
  } else {
    console.log('SignUp success:', signUpData.user?.id)
  }

  // Sign In test
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInErr) {
    console.log('SignIn test:', signInErr.message)
  } else {
    console.log('SignIn success! Session token active for Super Admin:', signInData.user.id)
  }
}

run()
