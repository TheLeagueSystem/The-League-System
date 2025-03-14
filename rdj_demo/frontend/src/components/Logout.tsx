import { useNavigate } from "react-router-dom";

const Logout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("is_admin");
        localStorage.removeItem("username");
        navigate("/login");
    };

    return <button onClick={handleLogout}>Logout</button>;
};

export default Logout;
