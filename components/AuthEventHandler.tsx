
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthEventHandler = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                console.log("Auth Event: PASSWORD_RECOVERY detected. Redirecting to update password.");
                navigate('/update-password');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [navigate]);

    return null;
};

export default AuthEventHandler;
