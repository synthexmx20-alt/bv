import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

import { Icon } from '../Icon';
const VisitorStats = () => {
    const [count, setCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                // Get approximate count
                const { count, error } = await supabase
                    .from('unique_visitors')
                    .select('*', { count: 'exact', head: true });

                if (error) throw error;
                setCount(count);
            } catch (err) {
                console.error('Error fetching visitor count:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCount();

        // Optional: Realtime subscription could be added here
        const channel = supabase
            .channel('visitor_count')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'unique_visitors' }, () => {
                fetchCount();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (loading) return null;

    return (
        <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                <Icon name="visibility" size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Visitas Únicas</p>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold dark:text-white">
                        {count !== null ? count.toLocaleString() : '-'}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                        Total
                    </span>
                </div>
            </div>
        </div>
    );
};

export default VisitorStats;
