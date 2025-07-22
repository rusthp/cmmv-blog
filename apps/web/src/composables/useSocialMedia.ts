import { computed, ref } from 'vue'

interface SocialImageOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
}

export function useSocialMedia() {
  /**
   * Otimiza uma imagem para uso em redes sociais
   * @param imageUrl URL da imagem original
   * @param options Opções de otimização
   * @returns URL da imagem otimizada e tipo MIME
   */
  const optimizeImageForSocial = (
    imageUrl: string | null | undefined,
    options: SocialImageOptions = {}
  ) => {
    if (!imageUrl) {
      return {
        url: null,
        type: 'image/jpeg'
      }
    }

    // Se a imagem já for uma URL externa, usar como está
    if (imageUrl.startsWith('http')) {
      const extension = imageUrl.split('.').pop()?.toLowerCase()
      let type = 'image/jpeg' // Default seguro para Twitter
      
      switch (extension) {
        case 'jpg':
        case 'jpeg':
          type = 'image/jpeg'
          break
        case 'png':
          type = 'image/png'
          break
        case 'webp':
          // Twitter suporta WebP, mas JPEG é mais universal
          type = options.format === 'webp' ? 'image/webp' : 'image/jpeg'
          break
        case 'gif':
          type = 'image/gif'
          break
        default:
          type = 'image/jpeg'
      }

      return {
        url: imageUrl,
        type
      }
    }

    // Para imagens base64 ou que precisam de processamento,
    // retorna a original por enquanto (pode ser expandido para usar a API)
    return {
      url: imageUrl,
      type: 'image/jpeg'
    }
  }

  /**
   * Gera metadados completos para redes sociais
   * @param post Dados do post
   * @param settings Configurações do site
   * @param baseUrl URL base do post
   * @returns Metadados otimizados para redes sociais
   */
  const generateSocialMetadata = (
    post: any,
    settings: any,
    baseUrl: string
  ) => {
    if (!post?.title || !post?.slug) {
      return { meta: [], link: [] }
    }

    const description = post.description || post.excerpt || 
      (post.content ? post.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : '')

    const keywords = post.keywords || 
      (post.tags?.map((tag: any) => tag.name).join(', ') || '')

    // Otimizar imagem para redes sociais
    const originalImageUrl = post.featureImage || settings?.['blog.image'] || ''
    const { url: imageUrl, type: imageType } = optimizeImageForSocial(originalImageUrl, {
      format: 'jpeg', // JPEG é o mais compatível com todas as redes
      width: 1200,
      height: 675,
      quality: 85
    })

    const siteName = settings?.['blog.title'] || 'ProPlay News'

    // Metadados específicos para article tags
    const articleMeta = keywords
      .split(', ')
      .filter(k => k.trim())
      .map((k: string) => ({ property: 'article:tag', content: k.trim() }))

    return {
      title: post.title,
      meta: [
        { name: 'description', content: description },
        { name: 'keywords', content: keywords },
        
        // Open Graph meta tags
        { property: 'og:type', content: 'article' },
        { property: 'og:title', content: post.title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: imageUrl },
        { property: 'og:url', content: baseUrl },
        { property: 'og:site_name', content: siteName },
        
        // Metadados específicos da imagem
        ...(imageUrl ? [
          { property: 'og:image:type', content: imageType },
          { property: 'og:image:alt', content: post.title },
          { property: 'og:image:secure_url', content: imageUrl },
          { property: 'og:image:width', content: '1200' },
          { property: 'og:image:height', content: '675' },
        ] : []),
        
        // Timestamps
        { property: 'og:updated_time', content: post?.updatedAt ? new Date(post.updatedAt).toISOString() : new Date().toISOString() },
        { property: 'article:published_time', content: post?.status === 'published' && post?.publishedAt ? new Date(post.publishedAt).toISOString() : post?.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString() },
        { property: 'article:modified_time', content: post?.updatedAt ? new Date(post.updatedAt).toISOString() : new Date().toISOString() },
        
        // Twitter Card meta tags - otimizados para máxima compatibilidade
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@proplaynews' },
        { name: 'twitter:creator', content: '@proplaynews' },
        { name: 'twitter:title', content: post.title },
        { name: 'twitter:description', content: description },
        
        // Imagem do Twitter
        ...(imageUrl ? [
          { name: 'twitter:image', content: imageUrl },
          { name: 'twitter:image:alt', content: post.title },
        ] : []),
        
        // Domínio para o Twitter
        { name: 'twitter:domain', content: baseUrl.replace(/^https?:\/\//, '').split('/')[0] },
        
        // Tags do artigo
        ...articleMeta
      ],
      link: [
        { rel: 'canonical', href: baseUrl },
      ],
    }
  }

  /**
   * Valida se uma URL de imagem está acessível
   * @param imageUrl URL da imagem
   * @returns Promise<boolean>
   */
  const validateImageUrl = async (imageUrl: string): Promise<boolean> => {
    if (!imageUrl || !imageUrl.startsWith('http')) return false

    try {
      const response = await fetch(imageUrl, { method: 'HEAD' })
      const contentType = response.headers.get('content-type')
      return response.ok && (contentType?.startsWith('image/') ?? false)
    } catch {
      return false
    }
  }

  return {
    optimizeImageForSocial,
    generateSocialMetadata,
    validateImageUrl
  }
} 