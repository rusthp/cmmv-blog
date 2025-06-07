/**
 * Configurações para otimização de imagens do tema ProPlayNews
 * Este arquivo contém configurações para processamento e otimização de imagens.
 */

module.exports = {
  // Configurações para diferentes tamanhos de imagens
  imageSizes: {
    thumbnail: {
      width: 150,
      height: 150,
      quality: 80
    },
    small: {
      width: 300,
      height: 200,
      quality: 85
    },
    medium: {
      width: 600,
      height: 400,
      quality: 85
    },
    large: {
      width: 900,
      height: 600,
      quality: 85
    },
    hero: {
      width: 1200,
      height: 630,
      quality: 90
    }
  },
  
  // Formatos a serem gerados para cada imagem
  formats: ['webp', 'jpg'],
  
  // Regras de transformação para diferentes seções do site
  transformRules: {
    // Tela inicial
    home: {
      featured: 'hero',
      highlights: 'medium',
      latestNews: 'small'
    },
    // Páginas de artigos
    post: {
      featured: 'hero',
      content: 'large',
      related: 'small'
    },
    // Listagens
    list: {
      card: 'medium',
      compact: 'small'
    }
  },
  
  // Configurações de lazy loading
  lazyLoading: {
    enabled: true,
    threshold: 200, // pixels antes de carregar
    placeholder: {
      enabled: true,
      type: 'blur', // 'blur', 'color', 'svg'
      quality: 10,
      size: 20
    }
  },
  
  // Configurações para CDN ou armazenamento externo
  storage: {
    useRemote: false,
    cdnUrl: process.env.CDN_URL || '',
    optimizationParams: {
      // Parâmetros para passagem à CDN para resizing dinâmico
      width: 'w',
      height: 'h',
      quality: 'q',
      format: 'f'
    }
  },
  
  // Exemplos de como usar a otimização de imagens:
  usage: {
    // Em componentes Vue
    vueComponent: `
      <OptimizedImage
        src="/images/post-image.jpg"
        alt="Descrição da imagem"
        :preset="'medium'"
        width="600"
        height="400"
        :lazy="true"
      />
    `,
    
    // Usando em CSS (com srcset responsivo)
    cssBackground: `
      .element {
        background-image: url('/images/optimized/small/image.webp');
      }
      
      @media (min-width: 768px) {
        .element {
          background-image: url('/images/optimized/medium/image.webp');
        }
      }
      
      @media (min-width: 1200px) {
        .element {
          background-image: url('/images/optimized/large/image.webp');
        }
      }
    `,
    
    // Função JS para obter URL otimizada
    jsUsage: `
      import { getOptimizedImageUrl } from './helpers/image';
      
      const imageUrl = getOptimizedImageUrl('/images/original.jpg', {
        preset: 'medium',
        format: 'webp'
      });
    `
  }
}; 