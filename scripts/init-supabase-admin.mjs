import fs from 'fs'

let url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8')
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/)
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/)
  if (urlMatch) url = urlMatch[1].trim()
  if (keyMatch) serviceKey = keyMatch[1].trim()
}

if (!url || !serviceKey) {
  console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment or .env.local')
  process.exit(1)
}

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
