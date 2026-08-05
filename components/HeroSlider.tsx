import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const SLIDES = [
    {
        id: 1,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBe18GBdojhU7CnFZyQn1pIjOuwKOGV6RGg-FcMXc-6Wnz_Tm-iFy2vH0xi6ns6la2Y6rXcmTXU23domurbvY-FOkCQv7ZnE5t5APq0LB1JmUi1fNEpWsLRVWYhtmgsKaS6XJaqEd6Jg4hVsuai2Bkl_8AFCMyk8uz3Tz8ZVEam06FCNC3KDYeKR6yHFwPiP1B285cT7pPEpqyaWMaPVSlISNKfgC43ZGCNLQG4euEkUeyClsS7tOghcwMWrfDaT-z2zSvBkDRE1Q0',
        title: 'Elevando Momentos en Chihuahua',
        subtitle: 'Arreglos de lujo sostenibles entregados con precisión y cuidado.',
        cta: 'Explorar Colección',
        link: '/catalog',
        position: 'center'
    },
    {
        id: 2,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkR_fLUspDK6DSFltRDjQJ9-jzsD-TJBqtIzZSQJX_Oavg2lFSUJWSY3Zi0MuiGtaDbwIkrU71bH8nCvJmerBZLkXWPkE5hkJ4MUB65kN7MaJhLd8xOedb46L_Yp-PaqhU0xhwduXCj9ho2WQ5Q36y2khw8DW6CfZy8dKIrbjs6i0OCWfDrfCHGBn_yp_ZXOl-JMclc1XM4kBmUrDRPL0Zi4Kp8cj5Ea06n1Ll2b8LDYBbEEVL3QtKTRdNhIIkBpVKjCijFjWoJXY',
        title: 'Colección Sostenible',
        subtitle: 'Belleza natural cultivada con responsabilidad ambiental.',
        cta: 'Ver Sustentables',
        link: '/catalog',
        position: 'center'
    },
    {
        id: 3,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0yNPC5t7f36QpLhoAQX-WQQgHWJqybUmVo5hTwU7cf9ZdBnLxJFTheAMhSciDFR9d2ZkvrgO-XbAMdGX0UvyPT0ginp3LfcVthXR1oonBjn9Z7aWfbD3iiCNBcz6Pf6X69a4CoMQCMj14pk94S4PMz_DM_klynwS1-xsxpYi0aDOCcyHEjNi3nO3tR7P2oYmH-q5oytl_AackRZ_xTUt7Yx3m2t8E9zG4HFhZGImqS9X4Yg6oC4lVNbDg7A4N0-EOTgpTiW8-KYs',
        title: 'Celebra Cada Instante',
        subtitle: 'El regalo perfecto para expresar lo que sientes.',
        cta: 'Comprar Ahora',
        link: '/catalog',
        position: 'center'
    }
];

const HeroSlider = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full h-[600px] lg:h-[700px] overflow-hidden bg-gray-900">
            {SLIDES.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                >
                    {/* Background Image with Overlay */}
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[6000ms] ease-linear transform scale-105"
                        style={{
                            backgroundImage: `url('${slide.image}')`,
                            transform: index === currentSlide ? 'scale(1.1)' : 'scale(1.0)'
                        }}
                    >
                        <div className="absolute inset-0 bg-black/40 lg:bg-black/30 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                    </div>

                    {/* Content */}
                    <div className="relative z-20 h-full flex flex-col items-center pt-32 md:pt-40 text-center px-4">
                        <div className="max-w-4xl flex flex-col items-center gap-6">
                            <img
                                src="/logo_principal_comprimido.webp"
                                alt="Blue Velvet Florería"
                                className="h-40 md:h-56 w-auto object-contain animate-fadeIn drop-shadow-2xl mb-6"
                            />
                            <h1 className="text-white text-5xl md:text-7xl font-black leading-tight tracking-tight drop-shadow-2xl opacity-0 animate-slideUp" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                                {slide.title}
                            </h1>
                            <p className="text-gray-100 text-lg md:text-2xl font-medium leading-relaxed max-w-2xl mx-auto drop-shadow-lg opacity-0 animate-slideUp" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
                                {slide.subtitle}
                            </p>
                            <Link
                                to={slide.link}
                                className="mt-8 px-10 py-4 bg-primary hover:bg-blue-600 text-white rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-primary/50 opacity-0 animate-slideUp"
                                style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}
                            >
                                {slide.cta}
                            </Link>
                        </div>
                    </div>
                </div>
            ))}

            {/* Indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
                {SLIDES.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-primary w-8' : 'bg-white/50 hover:bg-white'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroSlider;
