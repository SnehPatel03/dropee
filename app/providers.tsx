import {ThemeProvider as NextThemeProviders, ThemeProviderProps} from "next-themes";

// this is directly copied from doccs of imagekit:
 const authenticator = async () => {
        try {
            // Perform the request to the upload authentication endpoint.
            const response = await fetch("/api/image-kit-auth");
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Request failed with status ${response.status}: ${errorText}`);
            }
            const data = await response.json();
            const { signature, expire, token, publicKey } = data;
            return { signature, expire, token, publicKey };
        } catch (error) {
            console.error("Authentication error:", error);
            throw new Error("Authentication request failed");
        }
    };


export interface ProviderInterface {
    children : React.ReactNode,
    themeProp? :ThemeProviderProps
}

export function Providers({ children , themeProp }:ProviderInterface) {
  return <>
  {children}
  </>;
}
