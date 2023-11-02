import { useState } from "react";
import { toast } from "react-hot-toast";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../../firebase";

const UpdateUserForm = ({ openUpdateUserForm, setOpenUpdateUserForm, user, getUsers }) => {

    const [name, setName] = useState(user?.name);
    const [number, setNumber] = useState(user?.mobile_number);
    const [role, setRole] = useState(user?.role);

    const [nameError, setNameError] = useState('');
    const [numberError, setNumberError] = useState('');
    const [firebaseError, setFirebaseError] = useState('');

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!name) {
            setNameError('Name cannot be empty');
        } else {
            setNameError('');
        }

        if (!number) {
            setNumberError('Mobile number cannot be empty');
        } else {
            setNumberError('');
        }

        if (!name || !number) {
            return;
        }

        const toastId = toast.loading("Processing...");

        try {
            const userRef = doc(db, "users", user?.uid);
            await updateDoc(userRef, { name, role, mobile_number: parseFloat(number) });
            getUsers();
            setOpenUpdateUserForm(false);
            toast.success("User updated successfully.", { id: toastId });
        } catch (err) {
            let errorMessage = "An error occurred. Please try again"
            setFirebaseError(errorMessage);
            toast.dismiss(toastId);
        }
    };

    return (
        <>
            {openUpdateUserForm && (
                <div
                    onClick={(e) => {
                        if (e.target.id === "overlay") {
                            setFirebaseError('');
                            setName(user?.name)
                            setNameError('');
                            setNumber(user?.mobile_number);
                            setNumberError('');
                            setOpenUpdateUserForm(false);
                        }
                    }}
                    id="overlay"
                    className="fixed top-0 right-0 bottom-0 left-0 bg-gray-500 bg-opacity-50 transition-all ease-out duration-200"
                ></div>
            )}

            <div className={`${openUpdateUserForm ? "right-[0]" : "right-[-42.5rem]"} w-[42.5rem] p-[2rem] flex flex-col bg-white fixed top-0 bottom-0 h-full transition-all ease-in-out duration-300 z-[50]`} >
                <div className="flex justify-between items-center mb-[2rem]">
                    <h1 className="text-[2rem] font-bold ">Update User</h1>
                    <i onClick={() => setOpenUpdateUserForm()} className="fa-solid fa-xmark text-[2rem] cursor-pointer"></i>
                </div>

                <form onSubmit={submitHandler} className="flex flex-col gap-[1rem]">
                    <div className="flex flex-col gap-[0.5rem]">
                        <label className="text-[1.25rem] text-gray-500 flex justify-between">Name</label>
                        <input
                            name="name"
                            type="text"
                            autoComplete="off"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="border border-gray-300 p-[0.75rem] rounded-[0.5rem] text-[1.5rem]"
                        />
                        <span style={{ height: nameError ? 'auto' : 0 }} className={`text-red-500 text-[1.25rem] ${nameError ? 'opacity-1 duration-300' : 'opacity-0'}`}>{nameError}</span>
                    </div>

                    <div className="flex flex-col gap-[0.5rem]">
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
                            className="border border-gray-300 p-[0.75rem] rounded-[0.5rem] text-[1.5rem]"
                        />
                        <span style={{ height: numberError ? 'auto' : 0 }} className={`text-red-500 text-[1.25rem] ${numberError ? 'opacity-1 duration-300' : 'opacity-0'}`}>{numberError}</span>
                    </div>

                    <div className="flex flex-col gap-[0.5rem]">
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
                        Update
                    </button>
                </form>
            </div>
        </>
    );
};

export default UpdateUserForm;