import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../../constants";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";  // Zakładam, że używasz react-toastify do powiadomień

function SuperUserRoute({ children }) {
    const [isAuthorized, setIsAuthorized] = useState(null);
    const [isSuperUser, setIsSuperUser] = useState(null);  // Początkowo null, aby czekać na wynik

    useEffect(() => {
        auth().catch(() => setIsAuthorized(false));
    }, []);

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        try {
            const res = await api.post("/api/token/refresh/", {
                refresh: refreshToken,
            });
            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                setIsAuthorized(true);
                await checkSuperUserStatus();  // Sprawdzenie statusu superużytkownika po odświeżeniu tokenu
            } else {
                setIsAuthorized(false);
            }
        } catch (error) {
            console.log(error);
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
            await checkSuperUserStatus();  // Sprawdzenie statusu superużytkownika, jeśli token jest ważny
        }
    };

    const checkSuperUserStatus = async () => {
        try {
            const res = await api.get("/api/check-superuser/");  // Endpoint do sprawdzenia statusu superużytkownika
            if (res.data.is_superuser) {
                setIsSuperUser(true);
            } else {
                setIsSuperUser(false);
                toast.error("Nie masz dostępu do tej strony!");  // Powiadomienie o braku dostępu
            }
        } catch (error) {
            console.log(error);
            setIsSuperUser(false);
            toast.error("Nie masz dostępu do tej strony!");  // Powiadomienie o braku dostępu
        }
    };

    // Jeśli stan autoryzacji lub superużytkownika jest jeszcze nieustalony (null), pokazujemy "Loading..."
    if (isAuthorized === null || isSuperUser === null) {
        return <div>Loading...</div>;
    }

    // Jeśli autoryzacja nie powiodła się lub użytkownik nie jest superużytkownikiem, przekieruj na stronę główną
    if (!isAuthorized || !isSuperUser) {
        return <Navigate to="/" />;
    }

    // Jeśli autoryzacja i sprawdzenie superużytkownika są poprawne, renderujemy dzieci komponentu
    return children;
}

export default SuperUserRoute;