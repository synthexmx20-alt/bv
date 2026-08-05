import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useVisitorTracker = () => {
    useEffect(() => {
        const trackVisit = async () => {
            try {
                // 1. Get or create visitor ID
                let visitorId = localStorage.getItem('bv_visitor_id');

                if (!visitorId) {
                    visitorId = crypto.randomUUID();
                    localStorage.setItem('bv_visitor_id', visitorId);
                }

                // 2. Upsert visit to Supabase
                const { error } = await supabase
                    .from('unique_visitors')
                    .upsert({
                        visitor_id: visitorId,
                        last_visit: new Date().toISOString(),
                        user_agent: navigator.userAgent
                    }, {
                        onConflict: 'visitor_id'
                    });

                if (error) {
                    console.error('Error tracking visit:', error);
                }
            } catch (err) {
                console.error('Visitor tracking failed:', err);
            }
        };

        // Only run once per session load
        trackVisit();
    }, []);
};
