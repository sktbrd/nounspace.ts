import React from "react";
import AddFidgetIcon from "@/common/components/atoms/icons/AddFidget";
import { FaPlus } from "react-icons/fa6";
import { first, map } from "lodash";
import { useLoadFarcasterUser } from "@/common/data/queries/farcaster";
import { useFarcasterSigner } from "@/fidgets/farcaster";
import { memo, useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/common/data/stores/app";
import { Reorder, AnimatePresence } from "framer-motion";
import { Tab } from "../atoms/reorderable-tab";
import { useRouter } from "next/router";
import { SpaceLookupInfo } from "@/common/data/stores/app/space/spaceStore";
import NogsGateButton from "./NogsGateButton";

interface TabBarProps {
  hasProfile: boolean;
  inEditMode: boolean;
  profileFid: number;
}

const TabBar = memo(function TabBar({
  hasProfile,
  inEditMode,
  profileFid,
}: TabBarProps) {
  const { fid: userFid } = useFarcasterSigner("navigation");
  const { data } = useLoadFarcasterUser(userFid);
  const user = useMemo(() => first(data?.users), [data]);
  const username = useMemo(() => user?.username, [user]);
  const router = useRouter();

  const {
    loadTabNames,
    loadTabOrdering,
    loadSpaceOrdering,
    updateTabOrdering,
    updateSpaceOrdering,
    commitTabToDatabase,
    commitSpaceToDatabase,
    commitHomebaseToDatabase,
    createTab,
    createSpace,
    deleteTab,
    renameTab,
    renameSpace,
  } = useAppStore((state) => ({
    commitHomebaseToDatabase: state.homebase.commitHomebaseToDatabase,
    commitTabToDatabase: state.homebase.commitHomebaseTabToDatabase,
    commitSpaceToDatabase: state.space.commitSpaceToDatabase,
    loadTabNames: state.homebase.loadTabNames,
    loadTabOrdering: state.homebase.loadTabOrdering,
    loadSpaceOrdering: state.space.loadSpaceOrderForFid,
    updateTabOrdering: state.homebase.updateTabOrdering,
    updateSpaceOrdering: state.space.updateLocalSpaceOrdering,
    createTab: state.homebase.createTab,
    createSpace: state.space.registerSpace,
    deleteTab: state.homebase.deleteTab,
    renameTab: state.homebase.renameTab,
    renameSpace: state.space.renameSpace,
  }));

  const { localTabStore } = useAppStore((state) => ({
    localTabStore: state.homebase.tabOrdering.local,
  }));
  const { localSpaceStore } = useAppStore((state) => ({
    localSpaceStore: state.space.spaceLookups,
  }));

  const [spaceTabs, setSpaceTabs] = useState([] as string[]);
  const [hasFetchedTabs, setHasFetchedTabs] = useState(false);
  const [selectedTab, setSelectedTab] = useState("");
  const urlPieces = router.asPath.split("/");

  function updateCurrentSelection() {
    const pathEnd = decodeURI(urlPieces[urlPieces.length - 1]);

    if (pathEnd === "homebase") {
      setSelectedTab("Feed");
    } else {
      setSelectedTab(pathEnd);
    }
  }

  function selectNewTab(tabName: string) {
    if (tabName != selectedTab) {
      const href = hasProfile
        ? `/s/${username}/${tabName}`
        : tabName == "Feed"
          ? `/homebase`
          : `/homebase/${tabName}`;
      router.push(href);
      setSelectedTab(tabName);
    }
  }

  function switchTab(tabName: string) {
    // Prevent work from being lost
    if (inEditMode) {
      if (hasProfile) {
        if (localSpaceStore[profileFid].local.some((x) => x.name === tabName)) {
          commitSpaceToDatabase(
            localSpaceStore[profileFid].local.find((x) => x.name === tabName)!
              .spaceId,
          );
        }
      } else if (
        localTabStore.includes(selectedTab) ||
        selectedTab === "Feed"
      ) {
        commitTab(selectedTab);
      }
    }

    selectNewTab(tabName);
  }

  async function getTabNames() {
    try {
      setHasFetchedTabs(false);

      if (hasProfile) {
        // Load the space ordering
        await loadSpaceOrdering(profileFid);
        if (localSpaceStore[profileFid] != undefined) {
          setSpaceTabs(localSpaceStore[profileFid].local.map((x) => x.name));
        }
      } else {
        // Check actual files
        const namesList = await loadTabNames();

        if (namesList.length !== 0) {
          let remoteTabNames = await loadTabOrdering();

          // Cross reference and update
          remoteTabNames = remoteTabNames.filter((x) => namesList.includes(x));
          const remainder = namesList.filter(
            (x) => !remoteTabNames.includes(x),
          );
          updateTabOrdering(remoteTabNames.concat(remainder));
        }
      }
      setHasFetchedTabs(true);
    } catch (e) {
      console.log("Hit an error: ", e);
    }
  }

  // Initial variables load
  useEffect(() => {
    if (!hasFetchedTabs) {
      console.log("fid: " + profileFid);
      getTabNames();
      updateCurrentSelection();
    }
  }, []);

  useEffect(() => {
    if (localSpaceStore[profileFid] != undefined) {
      setSpaceTabs(localSpaceStore[profileFid].local.map((x) => x.name));
    }
  }, [localSpaceStore[profileFid]]);

  async function commitTab(tabName: string) {
    if (inEditMode) {
      if (hasProfile) {
        // Find the associated spaceId
        const currentSpaceID = localSpaceStore[profileFid].local.find(
          (x) => x.name === tabName,
        );
        commitSpaceToDatabase(currentSpaceID!.spaceId);
      } else {
        if (tabName == "Feed") {
          commitHomebaseToDatabase();
        } else {
          commitTabToDatabase(tabName);
        }
      }
    }
  }

  function addNewSpaceLookup(info: SpaceLookupInfo) {
    const newSpaceOrdering = [] as SpaceLookupInfo[];
    // Copy existing array
    if (localSpaceStore[profileFid] != undefined) {
      localSpaceStore[profileFid].local.forEach((val) =>
        newSpaceOrdering.push(Object.assign({}, val)),
      );
    }

    // Add our new space lookup to it
    newSpaceOrdering.push(info);

    // Update localState
    setSpaceTabs(newSpaceOrdering.map((x) => x.name));

    // Update
    updateSpaceOrdering(profileFid, newSpaceOrdering, true);
  }

  async function pushNewTabOrdering(newTabOrder: string[]) {
    if (inEditMode) {
      if (hasProfile) {
        // Local update
        setSpaceTabs(newTabOrder);

        // Generate new SpaceLookup
        loadSpaceOrdering(profileFid);
        const newSpaceOrdering = [] as SpaceLookupInfo[];

        if (localSpaceStore[profileFid] != undefined) {
          newTabOrder.forEach((tabName) => {
            const currSpaceLookup = {
              name: tabName,
              spaceId: localSpaceStore[profileFid].local.find(
                (x) => x.name === tabName,
              )!.spaceId,
            };
            newSpaceOrdering.push(currSpaceLookup);
          });
        }

        // Save locally then commit
        updateSpaceOrdering(profileFid, newSpaceOrdering, true);
      } else {
        updateTabOrdering(newTabOrder, true);
      }
    }
  }

  function nextClosestTab(tabName: string) {
    const index = localTabStore.indexOf(tabName) - 1;
    if (index >= 0) {
      return localTabStore[index];
    } else {
      return "Feed";
    }
  }

  async function renameAndReload(tabName: string, newTabName: string) {
    if (inEditMode) {
      if (hasProfile) {
        const spaceLookups = await loadSpaceOrdering(profileFid);
        const currSpaceLookup = spaceLookups.find((obj) => {
          return obj.name === tabName;
        });
        await renameSpace(currSpaceLookup!.spaceId, newTabName);
      } else {
        const newTabOrdering = localTabStore.map((currTab) =>
          currTab == tabName ? newTabName : currTab,
        );
        await pushNewTabOrdering(newTabOrdering);
        await renameTab(tabName, newTabName);
      }

      selectNewTab(newTabName);
    }
  }

  function handleDeleteTab(tabName: string) {
    if (inEditMode) {
      selectNewTab(nextClosestTab(tabName));

      const newTabNames = localTabStore.filter((n) => n != tabName);
      pushNewTabOrdering(newTabNames);

      if (hasProfile) {
        //TODO
      } else {
        deleteTab(tabName);
      }
    }
  }

  function generateTabName() {
    const endIndex = hasProfile
      ? spaceTabs.length + 1
      : localTabStore.length + 1;
    const base = `Tab ${endIndex}`;
    let newName = base;
    let iter = 1;

    const tabNames = hasProfile ? spaceTabs : localTabStore;

    while (tabNames.includes(newName)) {
      newName = base + ` (${iter})`;
      iter += 1;
    }

    return newName;
  }

  async function handleCreateTab() {
    if (inEditMode) {
      const newTabName = generateTabName();

      if (hasProfile) {
        const spaceId = await createSpace(profileFid, newTabName);
        console.log(spaceId);

        if (spaceId != undefined) {
          addNewSpaceLookup({ spaceId: spaceId, name: newTabName });
          switchTab(newTabName);
        }
      } else {
        createTab(newTabName);
        const newTabNames = localTabStore.concat(newTabName);
        pushNewTabOrdering(newTabNames);
        switchTab(newTabName);
      }
    }
  }

  return (
    <div className="flex flex-row justify-center h-16 overflow-y-scroll w-full z-50 bg-white">
      <Reorder.Group
        as="ol"
        axis="x"
        onReorder={pushNewTabOrdering}
        className="flex flex-row gap-4 grow items-start m-4 tabs"
        values={hasProfile ? spaceTabs : localTabStore}
      >
        <AnimatePresence initial={false}>
          {!hasProfile && (
            <Tab
              key="Feed"
              tabName={"Feed"}
              inEditMode={inEditMode}
              isSelected={selectedTab === "Feed"}
              onClick={() => switchTab("Feed")}
              removeable={false}
              draggable={false}
              renameable={false}
            />
          )}
          {map(localTabStore, (tabName: string) => {
            return (
              <Tab
                key={tabName}
                tabName={tabName}
                inEditMode={inEditMode}
                isSelected={selectedTab === tabName}
                onClick={() => switchTab(tabName)}
                removeable={true}
                draggable={inEditMode}
                renameable={true}
                onRemove={() => handleDeleteTab(tabName)}
                renameTab={renameAndReload}
              />
            );
          })}
        </AnimatePresence>
      </Reorder.Group>

      {inEditMode ? (
        <div className="flex flex-row pr-32">
          <NogsGateButton
            onClick={handleCreateTab}
            className="items-center flex rounded-xl p-2 m-3 px-auto bg-[#F3F4F6] hover:bg-sky-100 text-[#1C64F2] font-semibold"
          >
            <div className="ml-2">
              <FaPlus />
            </div>
            <span className="ml-4 mr-2">Tab</span>
          </NogsGateButton>
        </div>
      ) : null}
    </div>
  );
});

export default TabBar;
