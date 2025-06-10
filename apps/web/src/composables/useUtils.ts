export const formatDate = (timestamp: string) => {
    if (!timestamp) return 'Unknown date';

    try {
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    } catch (error) {
        return 'Invalid date';
    }
};

export const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<\/?[^>]+(>|$)/g, " ").replace(/\s+/g, " ").trim();
};

export const hasAudio = (content: string) => {
    if (!content) return false;
    
    // Verificar se há elementos de áudio do editor
    return content.includes('class="audio-embed"') || 
           content.includes('data-audio-src') || 
           content.includes('<audio');
};

export const extractAudioUrl = (content: string) => {
    if (!content) return null;
    
    // Debug: imprimir o conteúdo para diagnóstico
    if (content.includes('audio')) {
        console.log('Content with audio detected:', content.substring(0, 500));
    }
    
    // Buscar por data-audio-src primeiro (formato do editor TipTap)
    const audioSrcMatch = content.match(/data-audio-src=["']([^"']+)["']/);
    if (audioSrcMatch) {
        const url = cleanAudioUrl(audioSrcMatch[1]);
        console.log('Audio URL extracted from data-audio-src:', url);
        return getProxiedAudioUrl(url);
    }
    
    // Buscar por tag audio HTML com src
    const audioTagMatch = content.match(/<audio[^>]+src=["']([^"']+)["']/);
    if (audioTagMatch) {
        const url = cleanAudioUrl(audioTagMatch[1]);
        console.log('Audio URL extracted from audio tag:', url);
        return getProxiedAudioUrl(url);
    }
    
    // Buscar apenas por src dentro de audio-embed
    const audioEmbedMatch = content.match(/class=["']audio-embed["'][^>]*>[\s\S]*?src=["']([^"']+)["']/);
    if (audioEmbedMatch) {
        const url = cleanAudioUrl(audioEmbedMatch[1]);
        console.log('Audio URL extracted from audio-embed:', url);
        return getProxiedAudioUrl(url);
    }
    
    console.log('No audio URL found in content');
    return null;
};

const cleanAudioUrl = (url: string): string => {
    if (!url) return url;
    
    // Decodificar HTML entities
    const decoded = url
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    
    // Remover & extra no final
    const cleaned = decoded.replace(/&+$/, '');
    
    console.log('Cleaned URL:', cleaned);
    return cleaned;
};

export const getProxiedAudioUrl = (originalUrl: string): string => {
    if (!originalUrl) return originalUrl;
    
    // Lista de domínios que geralmente têm problemas de CORS
    const corsProblematicDomains = [
        'cdn.discordapp.com',
        'discord.com',
        'drive.google.com',
        'dropbox.com'
    ];
    
    // Verificar se a URL precisa de proxy
    const needsProxy = corsProblematicDomains.some(domain => originalUrl.includes(domain));
    
    if (needsProxy) {
        console.log('URL needs proxy due to CORS:', originalUrl);
        // Por enquanto, retornar a URL original e implementar solução no player
        console.log('Returning original URL for now (will handle CORS in player):', originalUrl);
        return originalUrl;
    }
    
    console.log('URL does not need proxy:', originalUrl);
    return originalUrl;
};