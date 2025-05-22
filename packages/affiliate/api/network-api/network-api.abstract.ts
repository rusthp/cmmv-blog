export abstract class NetworkApiAbstract {
    abstract getCampaigns(urlApi: string, metadata?: any): Promise<any>;
    abstract getCoupons(urlApi: string, metadata?: any): Promise<any>;
    abstract getDeeplink(urlApi: string, metadata?: any): Promise<any>;

    /**
     * Resolve the shortened URL by following all redirects until reaching the final destination
     * @param shortenedUrl Initial URL to resolve
     * @param removeQueryParams Whether to remove query parameters from the final URL
     * @param maxRedirects Maximum number of redirects to follow (to prevent infinite loops)
     * @returns The final destination URL
     */
    public async resolveShortenedUrl(
        shortenedUrl: string,
        removeQueryParams: boolean = true,
        maxRedirects: number = 10
    ): Promise<string> {
        let currentUrl = shortenedUrl;

        try {
            let redirectCount = 0;
            let isRedirect = true;

            while (isRedirect && redirectCount < maxRedirects) {
                const response = await fetch(currentUrl, {
                    method: 'GET',
                    redirect: 'manual'
                });

                if (response.status === 301 || response.status === 302 || response.status === 303 || response.status === 307) {
                    const redirectUrl = response.headers.get('location');

                    if (!redirectUrl) {
                        isRedirect = false;
                    } else {
                        let nextUrl = redirectUrl;

                        if (redirectUrl.startsWith('/')) {
                            const baseUrl = new URL(currentUrl);
                            nextUrl = `${baseUrl.protocol}//${baseUrl.host}${redirectUrl}`;
                        }

                        currentUrl = nextUrl;
                        redirectCount++;
                    }
                } else if (response.status === 200) {
                    try {
                        const contentType = response.headers.get('content-type');
                        if (contentType && contentType.includes('text/html')) {
                            const html = await response.text();

                            const metaRefreshRegex = /<meta[^>]*http-equiv=["']?refresh["']?[^>]*content=["']?\d+;\s*url=([^"'>\s]+)["']/i;
                            const metaMatch = html.match(metaRefreshRegex);

                            if (metaMatch && metaMatch[1]) {
                                let metaRedirectUrl = metaMatch[1];

                                if (metaRedirectUrl.startsWith('/')) {
                                    const baseUrl = new URL(currentUrl);
                                    metaRedirectUrl = `${baseUrl.protocol}//${baseUrl.host}${metaRedirectUrl}`;
                                } else if (!metaRedirectUrl.startsWith('http')) {
                                    const baseUrl = new URL(currentUrl);
                                    metaRedirectUrl = `${baseUrl.protocol}//${metaRedirectUrl}`;
                                }

                                currentUrl = metaRedirectUrl;
                                redirectCount++;
                                continue;
                            }
                        }

                        isRedirect = false;
                    } catch (error) {
                        console.error('Error processing HTML content:', error);
                        isRedirect = false;
                    }
                } else {
                    isRedirect = false;
                }
            }

            if (removeQueryParams) {
                const parsedUrl = new URL(currentUrl);
                const cleanUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`;
                return cleanUrl;
            }

            return currentUrl;
        } catch (error) {
            if (removeQueryParams) {
                const parsedUrl = new URL(currentUrl);
                const cleanUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`;
                return cleanUrl;
            }

            return currentUrl;
        }
    }
}