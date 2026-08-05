import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Ramo Imperial',
    price: 1200,
    originalPrice: 1400,
    category: 'Rosas',
    occasions: ['Aniversario', 'Amor', 'Lujo'],
    description: 'Rosas rojas premium de exportación en una presentación clásica y elegante.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCzriQpbSh6m2SAGIFg75IMEXxdvZzIm30hZgKsh3Wq_z5NB8Jv_-flYoi1cNm0ELeT10y2LP21nU4IUyoBw6RNh0XI8uJRUb5a4TiQmgge__fu-tICy7D1QQjcpkkciKAhHxUd__39W1EmEMZ3kDmKwvTv_kjB_AKAcVxHUhKcPlruFF0ncOe5pWN79RTBzac-CKELSR6IFwenyRs9nLQ5vUnAueeAbsg2q9oavtsCgDuAt5oZzkRO9hB5u5xIdSTQvOsbggj48Q0',
    sizes: [
      { name: 'Petite', price: 950, description: '24 Rosas rojas premium. Un detalle delicado y potente para expresar cariño.' },
      { name: 'Standard', price: 1200, description: '50 Rosas rojas premium. La presentación clásica que impacta por su volumen y elegancia.' },
      { name: 'Grand', price: 1800, description: '100 Rosas rojas premium. Una declaración monumental de amor imposible de ignorar.' }
    ]
  },
  {
    id: '2',
    name: 'Velvet Orquídea',
    price: 1850,
    category: 'Orquídeas',
    occasions: ['Lujo', 'Agradecimiento', 'Aniversario'],
    description: 'Caja de lujo negra con orquídeas phalaenopsis blancas, símbolo de pureza y elegancia.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAumNqEfNOWLxt9u4Amf2BZ1XNsWuXZ6ohVV4N7JtDk8UykBIl5qvTJjSgIAFHxfO53pCHy81w6ALKsF4zVXkaNzXjihjq17uJM_ALDLsVKIlGPwLFAkeqqa2_QtF9ibOhMTG0Zl3yPY1iYcYaj_xlBINfYQJiMf510x6xzRwxzSm723JHor6HwQ1NFSe0FUmsW5wOBzJqMtgRjrgWt407KExxb9KGkyPUtYAfMrSK6SYZ87SgVmq03CKwBlXXBpZyxew5G_ihrz3U',
    sizes: [
      { name: 'Petite', price: 1500, description: '1 Vara de Orquídea Phalaenopsis doble en base minimalista. Elegancia pura.' },
      { name: 'Standard', price: 1850, description: '2 Varas de Orquídeas Phalaenopsis en caja de lujo Velvet. Sofisticación garantizada.' },
      { name: 'Grand', price: 2400, description: '3 Varas de Orquídeas Phalaenopsis con diseño envolvente. El máximo lujo floral.' }
    ]
  },
  {
    id: '3',
    name: 'Tulipanes de Holanda',
    price: 650,
    category: 'Tulipanes',
    occasions: ['Cumpleaños', 'Amistad', 'Agradecimiento'],
    description: 'Tulipanes holandeses en colores vibrantes, envueltos en papel kraft.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5XtNyOwZXbo-IIX8cM4YZr3LMNV216WmMw1jI9xODORl-6wE0CdhZlrUQq3Zg610sxUtVqx64djb5m56SC9FBD7pSYbScBuZfhbOE_JzXgutd8JBJMGtBjG1q8J6YoFxYKY7zT3TDib17jGuRO2p_XV96-2yrDC5qNDBykS7eMs154iV4Gh-Zxqx3rgTnQnykDIyIiNbiTn-2_C_OwUj3jw1uOHkzKPpoIN5EAHVaqn9qOq0zwUI3iOUy_mh8GxP2ye8TJQYpKN8',
    sizes: [
      { name: 'Petite', price: 450, description: '10 Tulipanes holandeses seleccionados. Color y alegría en su justa medida.' },
      { name: 'Standard', price: 650, description: '20 Tulipanes holandeses. Un ramo vibrante lleno de vida.' },
      { name: 'Grand', price: 950, description: '30 Tulipanes holandeses. Una explosión de color para celebrar a lo grande.' }
    ]
  },
  {
    id: '4',
    name: 'Velvet Red Roses',
    price: 1250,
    originalPrice: 1450,
    category: 'Rosas',
    occasions: ['Aniversario', 'Amor', 'Cumpleaños'],
    description: 'Nuestra colección firma. Rosas rojas seleccionadas a mano.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIh-ksQ-rkYLqaXZ-7Lpr4_HJR5nIxZ-_Bv_nzl468uNQ7vXZx6XtOiNJjDFEYkG3aP5IhcLiiLxwzgI3JzOa4k4Ka7oYp0aLGhVSGaXQOMft4IsNnGv4Rhp1ajMaGaF9JRmEAdg3VO07Sy97F9FIkPNcKfkoOKaVfyy0qT3PJ14Sg7LYRTYamoesbb_KSn0_dzUL_2FVTvivDCl5aIHwrGpYe0nvT7A4lA1z_HJT-Zykbk1SV-16Kfcb5hIJk7GZPbDrmYz0hZmg',
    sizes: [
      { name: 'Petite', price: 1000, description: '12 Rosas rojas de tallo largo. Clásico, directo y apasionado.' },
      { name: 'Standard', price: 1250, description: '24 Rosas rojas de tallo largo. El equilibrio perfecto entre elegancia y pasión.' },
      { name: 'Grand', price: 1800, description: '50 Rosas rojas de tallo largo. Para cuando las palabras no son suficientes.' }
    ]
  },
  {
    id: '5',
    name: 'Summer Breeze',
    price: 980,
    category: 'Mixto',
    occasions: ['Cumpleaños', 'Amistad', 'Recuperación'],
    description: 'Una mezcla vibrante de girasoles, rosas amarillas y follaje verde fresco.',
    image: 'https://picsum.photos/seed/flowers1/800/1000',
    sizes: [
      { name: 'Petite', price: 750, description: '5 Girasoles y follaje fino. Luz y energía en un arreglo compacto.' },
      { name: 'Standard', price: 980, description: '10 Girasoles, rosas amarillas y follaje eucalipto. Un día de sol hecho ramo.' },
      { name: 'Grand', price: 1350, description: '20 Girasoles y abundantes rosas amarillas. Un jardín entero de felicidad.' }
    ]
  },
  {
    id: '6',
    name: 'White Elegance',
    price: 1500,
    category: 'Lilis',
    occasions: ['Condolencias', 'Lujo', 'Agradecimiento'],
    description: 'Arreglo monumental de lilis blancas y rosas blancas en base de cerámica.',
    image: 'https://picsum.photos/seed/flowers2/800/1000',
    sizes: [
      { name: 'Petite', price: 1200, description: '5 Varas de Lilis blancas y follaje. Sobriedad y paz.' },
      { name: 'Standard', price: 1500, description: '10 Varas de Lilis y 12 Rosas blancas. Un tributo elegante y respetuoso.' },
      { name: 'Grand', price: 2100, description: '20 Varas de Lilis y 24 Rosas blancas en base premium. Máxima distinción.' }
    ]
  }
];

export const OCCASIONS_LIST = ['Cumpleaños', 'Aniversario', 'Amor', 'Lujo', 'Agradecimiento', 'Amistad', 'Condolencias', 'Recuperación'];

export const CATEGORY_LIST = [
  'Baúles o Cofres',
  'Cajas Circulares',
  'Cajas Corazón',
  'Cajas Cuadradas',
  'Cajas Octagonal',
  'Cajas Ovaladas',
  'Canastas',
  'Cerámica y Concreto',
  'Condolencias',
  'Esculturas',
  'Floreros',
  'Graduación',
  'Ramos o Bouquets'
];