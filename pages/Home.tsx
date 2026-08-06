import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

import HeroSlider from '../components/HeroSlider';

import { Icon } from '../components/Icon';
const HomePage = () => {
    const navigate = useNavigate();
    return (
        <div className="relative flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 flex flex-col items-center w-full">
                {/* Hero Section */}
                <HeroSlider />

                {/* Trust Bar */}
                <div className="w-full bg-background-light dark:bg-[#151725] py-10 border-y border-gray-200 dark:border-[#282b39]">
                    <div className="max-w-[960px] mx-auto px-4 text-center">
                        <p className="text-gray-500 dark:text-[#9da1b9] text-sm font-semibold uppercase tracking-widest mb-6">La Elección de los Mejores en Chihuahua</p>
                        <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                            <div className="h-8 flex items-center gap-2 text-[#111418] dark:text-white font-bold text-xl"><Icon name="verified" size={24} /><span>LUXE Events</span></div>
                            <div className="h-8 flex items-center gap-2 text-[#111418] dark:text-white font-bold text-xl"><Icon name="diamond" size={24} /><span>Elite Weddings</span></div>
                            <div className="h-8 flex items-center gap-2 text-[#111418] dark:text-white font-bold text-xl"><Icon name="apartment" size={24} /><span>Distrito 1</span></div>
                        </div>
                    </div>
                </div>
                {/* Featured Categories */}
                <div className="w-full bg-[#f0f2f4] dark:bg-[#0b0d15] py-16 md:py-24">
                    <div className="max-w-[1200px] mx-auto px-4 md:px-10">
                        <h2 className="text-[#111418] dark:text-white text-3xl font-bold leading-tight tracking-[-0.015em] mb-10">Colecciones Cursadas</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 h-auto lg:h-[600px]">
                            <div onClick={() => navigate('/catalog')} className="lg:col-span-8 relative rounded-xl overflow-hidden group cursor-pointer h-[300px] lg:h-full">
                                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAkR_fLUspDK6DSFltRDjQJ9-jzsD-TJBqtIzZSQJX_Oavg2lFSUJWSY3Zi0MuiGtaDbwIkrU71bH8nCvJmerBZLkXWPkE5hkJ4MUB65kN7MaJhLd8xOedb46L_Yp-PaqhU0xhwduXCj9ho2WQ5Q36y2khw8DW6CfZy8dKIrbjs6i0OCWfDrfCHGBn_yp_ZXOl-JMclc1XM4kBmUrDRPL0Zi4Kp8cj5Ea06n1Ll2b8LDYBbEEVL3QtKTRdNhIIkBpVKjCijFjWoJXY")' }}></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                                    <h3 className="text-white text-2xl font-bold mb-2">Colección Sostenible</h3>
                                    <span className="text-white text-sm font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">Comprar Ahora <Icon name="arrow_forward" size={14} /></span>
                                </div>
                            </div>
                            <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                                <div onClick={() => navigate('/catalog')} className="flex-1 relative rounded-xl overflow-hidden group cursor-pointer h-[250px] lg:h-auto">
                                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA0yNPC5t7f36QpLhoAQX-WQQgHWJqybUmVo5hTwU7cf9ZdBnLxJFTheAMhSciDFR9d2ZkvrgO-XbAMdGX0UvyPT0ginp3LfcVthXR1oonBjn9Z7aWfbD3iiCNBcz6Pf6X69a4CoMQCMj14pk94S4PMz_DM_klynwS1-xsxpYi0aDOCcyHEjNi3nO3tR7P2oYmH-q5oytl_AackRZ_xTUt7Yx3m2t8E9zG4HFhZGImqS9X4Yg6oC4lVNbDg7A4N0-EOTgpTiW8-KYs")' }}></div>
                                    <div className="absolute inset-0 bg-black/40 hover:bg-black/30 transition-colors flex items-center justify-center">
                                        <h3 className="text-white text-xl font-bold text-center">Ocasiones</h3>
                                    </div>
                                </div>
                                <div onClick={() => navigate('/catalog')} className="flex-1 relative rounded-xl overflow-hidden group cursor-pointer h-[250px] lg:h-auto">
                                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAfSB4-VRfwyfJcJW1WxJMdplkHFyKN_2-hfOiz1SHDl_n5QYTwXq6o7Ors1UvBDl3nVRIJh7LU5wwEKpMP78TjtEwXoUXB6v9CGwsw2nhkyPnFwqLWJ0uA2c7-QnjvptEb6FNXXtZlLABmajXCnWLHYeZkoM1tzQIS7WuFsPKQ-ZRRxnkdmkEKOLK-szHTa-DEWs13bmbSLHpXbL05NeGh3V9FK2HE_5UkyQG29PvfwxQLZH9IZLIdAb1Pwru1vK5MkXwdWhfSy98")' }}></div>
                                    <div className="absolute inset-0 bg-black/40 hover:bg-black/30 transition-colors flex items-center justify-center">
                                        <h3 className="text-white text-xl font-bold text-center">Regalos</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default HomePage;