import { signInWithEmailAndPassword } from 'firebase/auth';
import { useContext, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { AuthContext } from '../../context/AuthContextProvider';

// import logo
import Logo from "../../assets/logo.png"

// import components
import Spinner from '../util/spinner/Spinner';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [authError, setAuthError] = useState('');

    const { isLoggedIn, refreshLoading } = useContext(AuthContext)

    // submit handler
    const submitHandler = async (e) => {
        e.preventDefault();

        if (!email) {
            setEmailError('Please, enter the email');
        } else {
            setEmailError('');
        }

        if (!password) {
            setPasswordError('Please, enter the password');
        } else {
            setPasswordError('');
        }

        if (!email || !password) {
            return;
        }

        const toastId = toast.loading("Processing...");

        try {

            // sensitive
            localStorage.setItem('randomvalue', JSON.stringify(password));
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/admin/orders');
            toast.success("Logged in successfully!", { id: toastId });
        } catch (err) {
            let errorMessage;
            switch (err.code) {
                case "auth/invalid-email":
                case "auth/user-not-found":
                case "auth/wrong-password":
                    errorMessage = "Invalid credentials";
                    setAuthError(errorMessage);
                    break;

                default:
                    errorMessage = "An error occurred. Please try again";
                    setAuthError(errorMessage);
                    break;
            }
            toast.dismiss(toastId);
        }
    };


    if(refreshLoading){
        return <Spinner />
    }

    if(isLoggedIn){
        return navigate('/admin/orders');
    }

    return (
        <form className='h-[100vh] px-[2rem] flex flex-col justify-center items-center relative' onSubmit={submitHandler}>
            <div className="w-full text-center mb-20 flex flex-col items-center">
                <h1 className='text-[3rem]'>Login</h1>
                <span className='text-[1.5rem] text-gray-500'>Please, log in to access admin panel.</span>
            </div>

            <div className="w-[40rem] mb-[1.5rem] flex flex-col gap-[0.5rem]">
                <label className='text-[1.45rem] text-gray-500 flex justify-between'>Email</label>
                <input
                    name="email"
                    type="text"
                    autoComplete='off'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className='border outline-none border-gray-300 p-[0.75rem] rounded-[0.5rem] text-[1.5rem]'
                />
                <span style={{ height: emailError ? 'auto' : 0 }} className={`text-red-500 text-[1.25rem] ${emailError ? 'opacity-1 duration-300' : 'opacity-0'}`}>
                    {emailError}
                </span>
            </div>

            <div className="w-[40rem] mb-[1.5rem] flex flex-col gap-[0.5rem] relative">
                <label className='text-[1.45rem] text-gray-500 flex justify-between'>Password</label>

                <div className='flex items-center border border-gray-300 rounded-[0.5rem] overflow-hidden p-[0.75rem]'>
                    <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete='new-password'
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className='w-full outline-none text-[1.5rem] pr-[5rem]'
                    />
                    <i onClick={() => setShowPassword(!showPassword)} className={`${!showPassword ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"} cursor-pointer text-[#7d817e] text-[1.25rem]`}></i>
                </div>

                <span style={{ height: passwordError ? 'auto' : 0 }} className={`text-red-500 text-[1.25rem] ${passwordError ? 'opacity-1 duration-300' : 'opacity-0'}`}>
                    {passwordError}
                </span>
                {!passwordError && !emailError && <span style={{ height: authError ? 'auto' : 0 }} className={`text-red-500 text-[1.25rem] ${authError ? 'opacity-1 duration-300' : 'opacity-0'}`}>
                    {authError}
                </span>}
            </div>

            <div className='w-[40rem] mb-[2rem] flex items-center'>
                <Link to="/forgot-password" className='text-blue-500 text-[1.5rem]'>Forgot password?</Link>
            </div>

            <button type='submit' className="w-[40rem] text-[1.5rem] bg-blue-500 text-[#fff] px-[3rem] py-[1rem] rounded-[0.5rem] mb-[1rem] shadow-lg">
                Login
            </button>
        </form>
    )
}

export default Login;