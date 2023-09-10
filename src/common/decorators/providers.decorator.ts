import { SetMetadata } from "@nestjs/common";
import { Provider } from "../enums/provider.enum";

export const PROVIDERS_KEY = "providers";
export const Providers = (...providers: Provider[]) => SetMetadata(PROVIDERS_KEY, providers);
