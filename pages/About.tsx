import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AboutPage = () => (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        <Header />
        <section className="relative flex min-h-[600px] flex-col items-center justify-center overflow-hidden p-4">
            <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'linear-gradient(rgba(16, 19, 34, 0.4) 0%, rgba(16, 19, 34, 0.9) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuDuV0u_A0vXxXy38olcyyKE_fV_inzLCYLI91moTj13GZtNNqP6-ZAL2WSwHlNj1Xes9Lbwcs90BtS2VELr6WqD5tP_vSx-AB-9wBCCRDMvmGQqdL5RuXNDRYSS_TAWjKcYMHW8tj0D7wjaEbCYmAC-mroOFZklVgZY3B6pf1NVLprH5B0HAoi_02TBJYuTLHk91zG-dr3mneDufI1NXjnjiegl-RsWEwbfI_jGU4wHDEkss7Ph0f4iRkGGt-1w3WlG7K6S6NVt510")' }}></div>
            <div className="relative z-10 flex max-w-[960px] flex-col gap-6 text-center">
                <h1 className="text-white text-5xl font-black leading-tight tracking-[-0.033em] md:text-7xl">Más que flores,<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">historias.</span></h1>
                <h2 className="text-gray-200 text-lg font-normal leading-relaxed md:text-xl max-w-2xl mx-auto">Transformando el lenguaje de las flores desde el corazón de Chihuahua con una visión global de elegancia y sostenibilidad.</h2>
            </div>
        </section>
        <main className="flex flex-col items-center px-4 py-16 lg:px-40">
            <div className="flex w-full max-w-[1100px] flex-col gap-24">
                <div className="flex flex-col-reverse gap-12 lg:flex-row lg:items-center">
                    <div className="flex flex-1 flex-col gap-6">
                        <div className="flex flex-col gap-3">
                            <span className="text-primary font-bold uppercase tracking-wider text-sm">El Comienzo</span>
                            <h2 className="text-white text-3xl font-bold leading-tight md:text-4xl">Raíces en Chihuahua</h2>
                            <p className="text-text-muted text-lg leading-relaxed">Aunque no siempre fuimos Blue Velvet, nuestra esencia ha sido la misma desde el inicio. Nuestra historia evoluciona, pero mantenemos intacta nuestra misión: la incesante búsqueda de la excelencia en los detalles.</p>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="aspect-[4/3] w-full rounded-2xl bg-cover bg-center shadow-2xl shadow-blue-900/20" style={{ backgroundImage: 'url("/nosotros1.webp")' }}></div>
                    </div>
                </div>

                <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
                    <div className="flex-1">
                        <div className="aspect-[4/3] w-full rounded-2xl bg-cover bg-center shadow-2xl shadow-blue-900/20" style={{ backgroundImage: 'url("/nosotros2.webp")' }}></div>
                    </div>
                    <div className="flex flex-1 flex-col gap-6">
                        <div className="flex flex-col gap-3">
                            <span className="text-primary font-bold uppercase tracking-wider text-sm">Nuestra Trayectoria</span>
                            <h2 className="text-white text-3xl font-bold leading-tight md:text-4xl">Floreciendo desde 2022</h2>
                            <p className="text-text-muted text-lg leading-relaxed">
                                Desde 2022, hemos escrito capítulos inolvidables a través de nuestros ramos. Lo que inició como una pasión por las flores se ha convertido en un estandarte de elegancia en Chihuahua. Cada entrega no es solo un producto, es una promesa cumplida de calidad, puntualidad y sentimientos transformados en arte floral.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
        <Footer />
    </div>
);

export default AboutPage;