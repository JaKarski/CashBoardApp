import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../../constants";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

function SuperUserRoute({ children }) {
    const [isAuthorized, setIsAuthorized] = useState(null);
    const [isSuperUser, setIsSuperUser] = useState(null);

    useEffect(() => {
        auth().catch(() => setIsAuthorized(false));
    }, []);

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        try {
            const res = await api.post("/api/token/refresh/", { refresh: refreshToken });
            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                setIsAuthorized(true);
                await checkSuperUserStatus();
            } else {
                setIsAuthorized(false);
            }
        } catch (error) {
            setIsAuthorized(false);
        }
    };

    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
            setIsAuthorized(false);
            return;
        }
        const decoded = jwtDecode(token);
        const tokenExpiration = decoded.exp;
        const now = Date.now() / 1000;

        if (tokenExpiration < now) {
            await refreshToken();
        } else {
            setIsAuthorized(true);
            await checkSuperUserStatus();
        }
    };

    const checkSuperUserStatus = async () => {
        try {
            const res = await api.get("/api/check-superuser/");
            if (res.data.is_superuser) {
                setIsSuperUser(true);
            } else {
                setIsSuperUser(false);
                toast.error("You do not have access to this page!", { toastId: "no_access" });
            }
        } catch (error) {
            setIsSuperUser(false);
            toast.error("You do not have access to this page!", { toastId: "no_access" });
        }
    };

    if (isAuthorized === null || isSuperUser === null) {
        return <div>Loading...</div>;
    }

    if (!isAuthorized || !isSuperUser) {
        return <Navigate to="/" />;
    }

    return children;
}

export default SuperUserRoute;
