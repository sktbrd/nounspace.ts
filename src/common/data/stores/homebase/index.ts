import { StoreGet, StoreSet } from "../createStore";
import { AppStore } from "..";
import axios from "axios";
import { createClient } from "../../database/supabase/clients/component";
import { homebasePath } from "@/constants/supabase";
import { SignedFile } from "@/common/lib/signedFiles";
import { debounce } from "lodash";
import stringify from "fast-json-stable-stringify";
import axiosBackend from "../../api/backend";
import { SpaceConfig } from "@/common/components/templates/Space";
import INITIAL_HOMEBASE_CONFIG from "@/constants/intialHomebase";

interface HomeBaseStoreState {
  homebaseConfig?: SpaceConfig;
}

interface HomeBaseStoreActions {
  loadHomebase: () => Promise<SpaceConfig>;
  commitHomebaseToDatabase: () => Promise<void>;
  saveHomebaseConfig: (config: SpaceConfig) => Promise<void>;
}

export type HomeBaseStore = HomeBaseStoreState & HomeBaseStoreActions;

const HomeBaseStoreDefaults: HomeBaseStoreState = {};

export const createHomeBaseStoreFunc = (
  set: StoreSet<AppStore>,
  get: StoreGet<AppStore>,
): HomeBaseStore => ({
  ...HomeBaseStoreDefaults,
  loadHomebase: async () => {
    const supabase = createClient();
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("private")
      .getPublicUrl(homebasePath(get().account.currentSpaceIdentityPublicKey!));
    try {
      const { data } = await axios.get<Blob>(publicUrl, {
        responseType: "blob",
      });
      const fileData = JSON.parse(await data.text()) as SignedFile;
      const spaceConfig = JSON.parse(
        await get().account.decryptEncryptedSignedFile(fileData),
      ) as SpaceConfig;
      set((draft) => {
        draft.homebase.homebaseConfig = spaceConfig;
      });
      return spaceConfig;
    } catch (e) {
      set((draft) => {
        draft.homebase.homebaseConfig = INITIAL_HOMEBASE_CONFIG;
      });
      return INITIAL_HOMEBASE_CONFIG;
    }
  },
  commitHomebaseToDatabase: async () => {
    debounce(async () => {
      const localCopy = get().homebase.homebaseConfig;
      if (localCopy) {
        const file = await get().account.createEncryptedSignedFile(
          stringify(localCopy),
          "json",
          true,
        );
        // TO DO: Error handling
        await axiosBackend.post(`/api/space/homebase/`, file);
      }
    })();
  },
  saveHomebaseConfig: async (config) => {
    set((draft) => {
      draft.homebase.homebaseConfig = config;
    });
    get().homebase.commitHomebaseToDatabase();
  },
});