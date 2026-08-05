import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    return (
        <Link to={`/product/${product.id}`} className="group block bg-[#111] border border-gray-800 hover:border-primary/50 transition-all duration-300">
            <div className="relative aspect-square overflow-hidden">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="bg-primary text-white px-6 py-2 uppercase text-xs font-bold tracking-widest hover:bg-primary-dark transition-colors">
                        Ver Detalle
                    </span>
                </div>
            </div>
            <div className="p-4 text-center">
                <h3 className="text-white font-serif text-lg mb-2 group-hover:text-primary transition-colors">
                    {product.name}
                </h3>
                <p className="text-primary font-bold text-xl">
                    ${product.price}
                </p>
            </div>
        </Link>
    );
};

export default ProductCard;
