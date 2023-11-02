import { useContext, useState } from "react";
import { toast } from "react-hot-toast";
import { auth } from "../../../firebase";
import { setDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase";
import { AuthContext } from "../../../context/AuthContextProvider";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

const NewUserForm = ({ openNewUserForm, setOpenNewUserForm, getUsers }) => {
    // context
    const { currentUser } = useContext(AuthContext);

    const [role, setRole] = useState("staff");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [number, setNumber] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [firebaseError, setFirebaseError] = useState('');
    const [error, setError] = useState({
        nameError: "",
        emailError: "",
        numberError: "",
        passwordError: "",
        confirmPasswordError: ""
    });

    const resetForm = () => {
        setEmail("");
        setPassword("");
        setName("");
        setNumber("");
        setConfirmPassword("");
    };

    const handleClose = () => {
        setOpenNewUserForm(false);
        setFirebaseError('');
        setError({ nameError: "", emailError: "", numberError: "", passwordError: "", confirmPasswordError: "" });
        resetForm();
    };

    const submitHandler = async (e) => {
        e.preventDefault();

        setError({
            nameError: name ? "" : "Please, enter the name",
            emailError: email ? "" : "Please, enter the email",
            numberError: number ? "" : "Please, enter the number",
            passwordError: password ? "" : "Please, enter the password",
            confirmPasswordError: confirmPassword ? "" : "Please, enter the password"
        });

        if (!name || !email || !number || !password || !confirmPassword) {
            return;
        }

        if (password !== confirmPassword) {
            setError(prev => ({ ...prev, confirmPasswordError: "Passwords do not match" }));
            return;
        }

        const toastId = toast.loading("Processing...");

        try {
            //add new user
            const newUserCredentials = await createUserWithEmailAndPassword(auth, email, password);
            const newUserUid = newUserCredentials.user.uid;
            await setDoc(doc(db, "users", newUserUid), { name, email, role, mobile_number: parseFloat(number), active: true });
            await signInWithEmailAndPassword(auth, currentUser.email, JSON.parse(localStorage.getItem("randomvalue")));

            getUsers();
            handleClose();
            toast.success("User added successfully.", { id: toastId });

        } catch (err) {
            let errorMessage;
            switch (err.code) {
                case "auth/invalid-email":
                    setError(prev => ({ ...prev, emailError: "Invalid email" }));
                    break;

                case "auth/weak-password":
                    setError(prev => ({ ...prev, passwordError: "Password should be at least 6 characters long" }));
                    break;

                case "auth/email-already-in-use":
                    errorMessage = "";
                    setError(prev => ({ ...prev, emailError: "The email address is already registered" }));
                    break;

                default:
                    errorMessage = "An error occurred. Please try again";
                    setFirebaseError(errorMessage)
                    break;
            }

            toast.dismiss(toastId);
        }
    };

    return (
        <>
            {openNewUserForm && (
                <div
                    onClick={(e) => {
                        if (e.target.id === "overlay") {
                            handleClose();
                        }
                    }}
                    id="overlay"
                    className=" fixed top-0 right-0 bottom-0 left-0 bg-gray-500 bg-opacity-50 transition-all ease-out duration-200"
                ></div>
            )}

            <div className={`${openNewUserForm ? "right-[0]" : "right-[-42.5rem]"} overflow-y-auto w-[42.5rem] p-[2rem] flex flex-col justify-top bg-white fixed top-0 bottom-0 h-full transition-all ease-in-out duration-300 z-[50]`} >
                <div className="flex justify-between items-center mb-[2rem]">
                    <h1 className="text-[2rem] font-bold ">Add New User</h1>
                    <i onClick={handleClose} className="fa-solid fa-xmark text-[2rem] cursor-pointer" ></i>
                </div>

                <form onSubmit={submitHandler} className="flex flex-col gap-[1rem]" >
                    <div className="flex flex-col gap-[0.25rem]">
                        <label className="text-[1.25rem] text-gray-500 flex justify-between">Name</label>
                        <input
                            name="name"
                            type="text"
                            autoComplete="off"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="border border-gray-300 p-[0.5rem] rounded-[0.5rem] text-[1.5rem] outline-none"
                        />
                        <span className={`text-red-500 text-[1.25rem] ${error.nameError ? 'opacity-1 duration-300' : 'opacity-0'}`}>{error.nameError}</span>
                    </div>

                    <div className="flex flex-col gap-[0.25rem]">
                        <label className="text-[1.25rem] text-gray-500 flex justify-between">Email</label>
                        <input
                            name="email"
                            type="text"
                            autoComplete="off"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="border border-gray-300 p-[0.5rem] rounded-[0.5rem] text-[1.5rem] outline-none"
                        />
                        <span className={`text-red-500 text-[1.25rem] ${error.emailError ? 'opacity-1 duration-300' : 'opacity-0'}`}>{error.emailError}</span>
                    </div>

                    <div className="flex flex-col gap-[0.25rem]">
                        <label className="text-[1.25rem] text-gray-500 flex justify-between">Mobile Number</label>
                        <input
                            name="number"
                            type="text"
                            
                            value={number}
                            maxLength={10}
                            onChange={(e) => {
                                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                setNumber(numericValue)
                            }}
                            className="border border-gray-300 p-[0.5rem] rounded-[0.5rem] text-[1.5rem] outline-none"
                        />
                        <span className={`text-red-500 text-[1.25rem] ${error.numberError ? 'opacity-1 duration-300' : 'opacity-0'}`}>{error.numberError}</span>
                    </div>

                    <div className="flex flex-col gap-[0.25rem] relative">
                        <label className="text-[1.25rem] text-gray-500 flex justify-between">Password</label>
                        <div className="flex items-center border border-gray-300 rounded-[0.5rem] overflow-hidden p-[0.5rem] bg-white">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full outline-none text-[1.5rem] pr-[5rem]"
                            />
                            <i onClick={() => setShowPassword(!showPassword)} className={`${!showPassword ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"} cursor-pointer text-[#7d817e] text-[1.25rem]`}></i>
                        </div>
                        <span className={`text-red-500 text-[1.25rem] ${error.passwordError ? 'opacity-1 duration-300' : 'opacity-0'}`}>{error.passwordError}</span>
                    </div>

                    <div className="flex flex-col gap-[0.25rem] relative">
                        <label className="text-[1.25rem] text-gray-500 flex justify-between">Confirm Password</label>
                        <div className="flex items-center border border-gray-300 rounded-[0.5rem] overflow-hidden p-[0.5rem] bg-white">
                            <input
                                name="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full outline-none text-[1.5rem] pr-[5rem]"
                            />
                            <i onClick={() => setShowPassword(!showPassword)} className={`${!showPassword ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"} cursor-pointer text-[#7d817e] text-[1.25rem]`}></i>
                        </div>
                        <span className={`text-red-500 text-[1.25rem] ${error.confirmPasswordError ? 'opacity-1 duration-300' : 'opacity-0'}`}>{error.confirmPasswordError}</span>
                    </div>

                    <div className="flex flex-col gap-[0.25rem]">
                        <label className="text-[1.25rem] text-gray-500">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="bg-gray-200 rounded-[0.5rem]  p-[1rem] text-[1.5rem]"
                        >
                            <option value="admin" className="bg-white">Admin</option>
                            <option value="staff" className="bg-white">Staff</option>
                        </select>
                    </div>

                    <span className={`text-red-500 text-[1.25rem] ${firebaseError ? 'opacity-1 duration-300 my-[0.5rem]' : 'opacity-0'}`}>{firebaseError}</span>

                    <button
                        type="submit"
                        className="text-[1.5rem] bg-blue-500 transition-all ease duration-200 text-[#fff] px-[3rem] py-[1rem] rounded-[0.5rem] shadow-lg"
                    >
                        Save
                    </button>
                </form>
            </div>
        </>
    );
};

export default NewUserForm;