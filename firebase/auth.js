import { auth } from './firebase'
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInAnonymously, deleteUser} from 'firebase/auth'

const authIntance = getAuth(app)
export{

}