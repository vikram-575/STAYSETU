import { initializeApp, getApps } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'

const firebaseConfig = {
  projectId: 'staysetu-1bf2f',
  appId: '1:736756765234:web:3860429390129871dbe22b',
  storageBucket: 'staysetu-1bf2f.firebasestorage.app',
  apiKey: 'AIzaSyAnrjrrk7X3E2tl8uqsMKealMKE5L0Ty9M',
  authDomain: 'staysetu-1bf2f.firebaseapp.com',
  messagingSenderId: '736756765234',
  measurementId: 'G-WDEQGD48CT',
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
const auth = getAuth(app)

const email = 'vikramtomar0505@gmail.com'
const password = 'qwerty123'

async function run() {
  console.log(`Setting up super admin for ${email}...`)
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    console.log('Successfully created Firebase user:', cred.user.uid)
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log('User already exists in Firebase. Verifying login...')
      const cred = await signInWithEmailAndPassword(auth, email, password)
      console.log('Login verified successfully:', cred.user.uid)
    } else {
      console.error('Firebase Auth error:', err.message)
    }
  }
}

run()
