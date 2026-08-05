import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
}

const SEO: React.FC<SEOProps> = ({
    title,
    description,
    image,
    url,
    type = 'website'
}) => {
    const siteTitle = 'Blue Velvet Florería';
    const finalTitle = title ? `${title} | ${siteTitle}` : siteTitle;

    // Default description if none provided
    const defaultDescription = 'Florería exclusiva en Chihuahua. Envíos a domicilio de ramos buchones, rosas premium y arreglos de lujo. Calidad garantizada para San Valentín y cualquier ocasión especial.';
    const finalDescription = description || defaultDescription;

    const finalUrl = url || window.location.href;
    // Fallback image if needed, or leave empty if none provided
    const finalImage = image || '';

    return (
        <Helmet>
            {/* Standard metadata */}
            <title>{finalTitle}</title>
            <meta name="description" content={finalDescription} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={finalUrl} />
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDescription} />
            {finalImage && <meta property="og:image" content={finalImage} />}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={finalUrl} />
            <meta name="twitter:title" content={finalTitle} />
            <meta name="twitter:description" content={finalDescription} />
            {finalImage && <meta name="twitter:image" content={finalImage} />}
        </Helmet>
    );
};

export default SEO;
