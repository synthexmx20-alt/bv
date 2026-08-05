import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

import { Icon } from '../../components/Icon';
interface SiteSetting {
    key: string;
    value: string;
    description: string;
}

const SettingsPage = () => {
    const [settings, setSettings] = useState<SiteSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .order('key');

            if (error) throw error;

            // Define all expected keys
            const expectedKeys = [
                'whatsapp_number',
                'facebook_url',
                'instagram_url',
                'site_title',
                'site_description',
                'maintenance_mode'
            ];

            // Merge fetched data with defaults for missing keys
            const mergedSettings = expectedKeys.map(key => {
                const existing = data?.find(s => s.key === key);
                return existing || { key, value: key === 'maintenance_mode' ? 'false' : '', description: '' };
            });

            setSettings(mergedSettings);
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ type: 'error', text: 'Error al cargar configuración' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (key: string, newValue: string | boolean) => {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value: String(newValue) } : s));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage(null);

            const updates = settings.map(setting =>
                supabase
                    .from('site_settings')
                    .upsert({
                        key: setting.key,
                        value: setting.value,
                        description: setting.description || ''
                    })
            );

            await Promise.all(updates);
            setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Error al guardar cambios' });
        } finally {
            setSaving(false);
        }
    };

    const getLabel = (key: string) => {
        switch (key) {
            case 'whatsapp_number': return 'Número de WhatsApp (mx)';
            case 'facebook_url': return 'Enlace de Facebook';
            case 'instagram_url': return 'Enlace de Instagram';
            case 'site_title': return 'Título del Sitio (SEO)';
            case 'site_description': return 'Descripción del Sitio (SEO)';
            case 'maintenance_mode': return 'Modo Mantenimiento';
            default: return key;
        }
    };

    const getIcon = (key: string) => {
        switch (key) {
            case 'whatsapp_number': return 'perm_phone_msg';
            case 'facebook_url': return 'public';
            case 'instagram_url': return 'photo_camera';
            case 'site_title': return 'title';
            case 'site_description': return 'description';
            case 'maintenance_mode': return 'construction';
            default: return 'settings';
        }
    };

    if (loading) return <div className="text-gray-500">Cargando configuración...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Configuración Global</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Administra los datos de contacto y redes sociales.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <Icon name="refresh" size={14} className="animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Icon name="save" size={14} />
                            Guardar Cambios
                        </>
                    )}
                </button>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    <Icon name={message.type === 'success' ? 'check_circle' : 'error'} size={24} />
                    {message.text}
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 space-y-6">
                {settings.map((setting) => (
                    <div key={setting.key} className="grid md:grid-cols-3 gap-4 items-center">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Icon name={getIcon(setting.key)} size={24} className="text-gray-400" />
                            {getLabel(setting.key)}
                        </label>
                        <div className="md:col-span-2">
                            {setting.key === 'maintenance_mode' ? (
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={setting.value === 'true'}
                                        onChange={(e) => handleInputChange(setting.key, e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                        {setting.value === 'true' ? 'Activado' : 'Desactivado'}
                                    </span>
                                </label>
                            ) : (
                                <input
                                    type="text"
                                    value={setting.value}
                                    onChange={(e) => handleInputChange(setting.key, e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    placeholder={`Ingresa ${getLabel(setting.key).toLowerCase()}`}
                                />
                            )}
                            <p className="text-xs text-gray-400 mt-1">{setting.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SettingsPage;
