import React from 'react';

const MaintenancePage = () => {
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Animated background decorations */}
            <div
                style={{
                    position: 'absolute',
                    top: '-150px',
                    right: '-150px',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
                    animation: 'pulse 4s ease-in-out infinite',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: '-100px',
                    left: '-100px',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.06) 0%, transparent 70%)',
                    animation: 'pulse 5s ease-in-out infinite reverse',
                }}
            />

            <div
                style={{
                    textAlign: 'center',
                    maxWidth: '520px',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                {/* Animated icon */}
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '96px',
                        height: '96px',
                        borderRadius: '24px',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        marginBottom: '32px',
                        animation: 'float 3s ease-in-out infinite',
                    }}
                >
                    <span
                        className="material-symbols-outlined"
                        style={{
                            fontSize: '48px',
                            color: '#818cf8',
                        }}
                    >
                        construction
                    </span>
                </div>

                {/* Logo */}
                <img
                    src="/logo_principal_comprimido.webp"
                    alt="Blue Velvet Florería"
                    style={{
                        height: '48px',
                        width: 'auto',
                        objectFit: 'contain',
                        filter: 'brightness(0) invert(1)',
                        marginBottom: '24px',
                    }}
                />

                {/* Main heading */}
                <h1
                    style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        color: '#f1f5f9',
                        marginBottom: '12px',
                        lineHeight: 1.3,
                        letterSpacing: '-0.025em',
                    }}
                >
                    Estamos en mantenimiento
                </h1>

                {/* Subtext */}
                <p
                    style={{
                        fontSize: '16px',
                        color: '#94a3b8',
                        lineHeight: 1.7,
                        marginBottom: '32px',
                    }}
                >
                    Estamos realizando mejoras para brindarte una mejor experiencia.
                    Volveremos muy pronto. ¡Gracias por tu paciencia!
                </p>

                {/* Decorative divider */}
                <div
                    style={{
                        width: '64px',
                        height: '3px',
                        borderRadius: '2px',
                        background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                        margin: '0 auto 32px',
                    }}
                />

                {/* Social / contact hint */}
                <p
                    style={{
                        fontSize: '13px',
                        color: '#64748b',
                    }}
                >
                    Mientras tanto, síguenos en redes sociales para estar al tanto.
                </p>
            </div>

            {/* Inline keyframe animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default MaintenancePage;
