import { Injectable } from "@angular/core";
import { cleanProfanity, containsProfanity } from "@tarot/core";

@Injectable({ providedIn: "root" })
export class ProfanityService {
  containsProfanity(text: string) {
    return containsProfanity(text);
  }

  clean(text: string) {
    return cleanProfanity(text);
  }
}
