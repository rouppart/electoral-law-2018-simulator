<script lang="ts">
  import Tailwind from "./Tailwind.svelte";
  import CoalitionEditor from "./components/CoalitionEditor.svelte";

  const districts = {
    beirut1: 'Beirut 1',
    beirut2: 'Beirut 2',
    bekaa1: 'Bekaa 1',
    bekaa2: 'Bekaa 2',
    bekaa3: 'Bekaa 3',
    mount1: 'Mount Lebanon 1',
    mount2: 'Mount Lebanon 2',
    mount3: 'Mount Lebanon 3',
    mount4: 'Mount Lebanon 4',
    north1: 'North 1',
    north2: 'North 2',
    north3: 'North 3',
    south1: 'South 1',
    south2: 'South 2',
    south3: 'South 3'
  }

  // Main Data
  let groups: Groups = {};
  let coalitions: Coalition[] = [];
  let white: number = 0;

  // Controls
  let selectedDistrictCode: string | null = null;
  let editMode: boolean = false;
  let showExcluded: boolean = false;
  let groupCodeToAdd: string = '';

  function addCoalition() {
    const newCoalition: Coalition = {name: '', candidates: [], votes: 0, color: ''};
    coalitions = [...coalitions, newCoalition];
  }

  function deleteCoalition(event: CustomEvent) {
    coalitions.splice(event.detail, 1);
    coalitions = coalitions;
  }

  $: seats = Object.values(groups).reduce((pV, cE) => pV + cE.seats, 0);
  $: hasSubdisctrics = !Object.values(groups).every((e) => !e.subdistrict);
  $: quotaPercent = 100 / seats;

  $: totalActualVotes = coalitions.reduce((pv, ce) => pv + ce.votes, 0) + white;

  function calculateQuota(seats: number, votes: number) {
    return votes / seats;
  }

  $: initialQuota = calculateQuota(seats, totalActualVotes);

  // Process Coalitions
  let processedCoalitions: ProcessedCoalition[];
  let eliminatedCoalitions: Coalition[];
  let totalCountedVotes: number;
  let endQuota: number;
  $: {
    // Initialize Processed Coalitions
    processedCoalitions = coalitions.map(
      (e, i) => {return {
        name: e.name,
        candidates: e.candidates,
        votes: e.votes,
        color: e.color,
        index: i,
        countedVotes: e.votes,
        fullSeats: 0,
        remainderVotes: 0,
        partialSeat: 0
      }}
    );
    eliminatedCoalitions = [];
    totalCountedVotes = totalActualVotes;
    endQuota = initialQuota;

    // Eliminate and calculate full Seats and Remainder
    processedCoalitions.sort((a, b) => a.votes - b.votes);
    for (const pCoal of processedCoalitions) {
      if (pCoal.votes < initialQuota) {
        totalCountedVotes -= pCoal.votes;
        pCoal.countedVotes = 0;
        eliminatedCoalitions = [...eliminatedCoalitions, pCoal];
        endQuota = calculateQuota(seats, totalCountedVotes);
      } else {  // Since pCoals is sorted by votes, this will apply after all eliminations
        pCoal.fullSeats = Math.floor(pCoal.votes / endQuota);
        pCoal.remainderVotes = pCoal.votes - pCoal.fullSeats * endQuota;
      }
    }

    // Handle remainders
    processedCoalitions.sort((a, b) => b.remainderVotes - a.remainderVotes); // Sort by remainder
    const partialSeats = seats - processedCoalitions.reduce((pV, cE) => pV + cE.fullSeats, 0);
    for (let i = 0; i < partialSeats && i < processedCoalitions.length; i++) {
      processedCoalitions[i].partialSeat = 1;
    }

    // Prepare for return
    processedCoalitions.sort((a, b) => a.index - b.index);
  }

  function getSubdistrictKey(candidate: Candidate | ProcessingCandidate | ProcessedCandidate): string {
    return groups[candidate.group]?.subdistrict ?? '';
  }


  let processedCandidates: ProcessedCandidate[];
  let subDistrictCount: CountDict;
  $: {
    processedCandidates = [];
    subDistrictCount = {};

    const groupCount: CountDict = {};
    for (let groupCode in groups) {
      groupCount[groupCode] = groups[groupCode].seats;
    }

    // Prepare Candidates for Processing, Collect accumulated data
    const coalitionCount: CountDict = {};
    const candidates: ProcessingCandidate[] = [];
    for (const pCoal of processedCoalitions) {
      coalitionCount[pCoal.index] = pCoal.fullSeats + pCoal.partialSeat;

      for (const cand of pCoal.candidates) {
        if (pCoal.countedVotes > 0) {
          const subCode = getSubdistrictKey(cand);
          if (!(subCode in subDistrictCount)) {
            subDistrictCount[subCode] = 0;
          }
          subDistrictCount[subCode] += cand.votes;
        }
        candidates.push({...cand, coalitionIndex: pCoal.index, preferentialPercent: 0, excludedByQuota: pCoal.countedVotes === 0});
      }
    }

    // Caluculate Preferrential Percent
    for (const candidate of candidates) {
      candidate.preferentialPercent = candidate.votes / subDistrictCount[getSubdistrictKey(candidate)] * 100;
    }

    // Process Win or Loss
    candidates.sort((a, b) => b.preferentialPercent - a.preferentialPercent);
    for (const candidate of candidates) {
      let lossByGoup = groupCount[candidate.group] <= 0;
      let lossByCoalition = coalitionCount[candidate.coalitionIndex] <= 0;
      let win = !lossByGoup && !lossByCoalition;
      processedCandidates.push({...candidate, lossByGroup: lossByGoup, lossByCoalition, win});
      if (win) {
        groupCount[candidate.group]--;
        coalitionCount[candidate.coalitionIndex]--;
      }
    }
  }

  function processJson(json: Dataset) {
    groups = json.groups;
    coalitions = json.coalitions;
    white = json.white;
  }

  async function loadDistrict(selectedDistrictCode: string | null) {
    if (selectedDistrictCode === null) {
      return;
    }
    const response = await fetch('/samples/' + selectedDistrictCode + '.json');
    processJson(await response.json());
  }
  $: loadDistrict(selectedDistrictCode);

  function downloadDataset() {
    const dataset: Dataset = {groups, coalitions, white};
    const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'election_data.json';
    a.click();
    a.remove();
  }

  function uploadDataset(event: Event) {
    const f = new FileReader()
    f.onload = (event) => {
      if (typeof event.target.result === 'string') {
        const json = JSON.parse(event.target.result);
        processJson(json);
      }
    };
    f.readAsText(event.target.files[0]);
  }

  function format(n: number, digits: number = 3) {
    return parseFloat(n.toFixed(digits)).toLocaleString();
  }
</script>

<style lang="postcss">
  header * {
    @apply my-1;
  }

  .header th {
    @apply self-end tracking-tight;
  }

  .tableborder td, .tableborder th {
    @apply border;
  }

  .section {
    @apply text-xl font-bold pt-3;
  }

  .coalitionbadge {
    @apply w-3 h-3 inline-block rounded mr-2;
  }
</style>

<Tailwind />

<header class="sticky top-0 flex flex-wrap lg:flex-nowrap justify-around items-center bg-gray-800 shadow-lg py-1">
  <label>
    <span class="font-bold text-white">District:</span>
    <select class="p-1" bind:value={selectedDistrictCode}>
      <option value={null}>Select District</option>
      {#each Object.keys(districts) as districtCode}
      <option value={districtCode}>{districts[districtCode]}</option>
      {/each}
    </select>
  </label>
  <button on:click={() => editMode = !editMode}>{editMode ? 'View Results' : 'Edit Dataset'}</button>
  <button on:click={downloadDataset}>Download Dataset</button>
  <label>
    <span class="font-bold text-white">Upload Dataset:</span>
    <input class="bg-white" type="file" on:change={uploadDataset} accept=".json">
  </label>
</header>

<main class="flex flex-col items-center space-y-4 py-6 bg-white">
  {#if editMode}
  <table>
    <tr>
      <th>Code</th>
      <th>Sect</th>
      <th>Subdistrict</th>
      <th>Seats</th>
      <th></th>
    </tr>
    {#each Object.keys(groups) as groupCode}
      <tr>
        <td>{groupCode}</td>
        <td><input type="text" bind:value={groups[groupCode].sect}></td>
        <td><input type="text" class="w-32" bind:value={groups[groupCode].subdistrict}></td>
        <td><input type="number" class="w-16 text-right" bind:value={groups[groupCode].seats}></td>
        <td><button class="deletebutton" on:click={() => {delete groups[groupCode]; groups = groups}}>X</button></td>
      </tr>
    {/each}
    <tr>
      <td>
        <input class="w-20" type="text" bind:value={groupCodeToAdd}>
      </td>
      <td colspan="3">
        <button on:click={() => {groups[groupCodeToAdd] = {sect: '', seats: 1}; groupCodeToAdd = ''}}>Add Group</button>
      </td>
    </tr>
  </table>

  <label class="font-bold">White Votes: <input type="number" class="w-24" bind:value={white}></label>

  {#each coalitions as coalition, index}
    <CoalitionEditor bind:coalition {groups} {index} on:deletecoalition={deleteCoalition}/>
  {/each}

  <div>
    <button on:click={addCoalition} class="w-max">Add Coalition</button>
  </div>

  {:else}

  {#if Object.keys(groups).length === 0}
  <h2 class="text-xl mt-6">Select District or Upload Dataset</h2>
  {:else}

  <div>
    <b>Seats:</b> {seats}
  </div>

  <div>
    <b>Quota %:</b> {format(quotaPercent, 2)}
  </div>


  <div>
    <b>Total Actual Votes:</b> {format(totalActualVotes)}
  </div>

  <div>
    <b>White Votes:</b> {format(white)}
  </div>

  <div>
    <b>Initial Quota:</b> {format(initialQuota)}
  </div>

  <div class="border-2 border-red-400 p-3">
    <h3 class="font-bold">Eliminated Coalitions</h3>
    {#each eliminatedCoalitions as eliminatedCoalition}
    <div>{eliminatedCoalition.name}</div>
    {/each}
  </div>

  <div>
    <b>Eliminated Votes:</b> {format(totalActualVotes - totalCountedVotes)} ({format((totalActualVotes - totalCountedVotes) / totalActualVotes * 100, 0)} %)
  </div>

  <div>
    <b>Total Counted Votes:</b> {format(totalCountedVotes)}
  </div>

  <div>
    <b>End Quota:</b> {format(endQuota)}
  </div>

  <h2 class="section">Coalitions</h2>

  <table class="tableborder">
    <tr>
      <td colspan="7" class="font-bold text-gray-500 text-right">V. = Votes; S. = Seats</td>
    </tr>

    <tr class="header">
      <th class="text-left">Coalition Name</th>
      <th>Actual V.</th>
      <th>Counted V.</th>
      <th>Full S.</th>
      <th>Remainder V.</th>
      <th>Partial S.</th>
      <th>Total S.</th>
    </tr>
    {#each processedCoalitions as pCoal}
      <tr>
        <td><div class="coalitionbadge" style="background-color: {pCoal.color}"></div>{coalitions[pCoal.index].name}</td>
        <td class="text-right">{format(coalitions[pCoal.index].votes)}</td>
        <td class="text-right" class:errortext={pCoal.countedVotes === 0}>{format(pCoal.countedVotes)}</td>
        <td class="text-right font-bold">{pCoal.fullSeats}</td>
        <td class="text-right">{format(pCoal.remainderVotes)}</td>
        <td class="text-right font-bold">{pCoal.partialSeat}</td>
        <td class="text-right font-bold text-green-600">{pCoal.fullSeats + pCoal.partialSeat}</td>
      </tr>
    {/each}
  </table>

  <h2 class="section">Candidates</h2>

  <table class="tableborder">
    <tr>
      <th>Subdistrict</th>
      <th>Total Preferential Votes</th>
    </tr>
    {#each Object.keys(subDistrictCount) as subCode}
    <tr>
      <td>{subCode || 'Main'}</td>
      <td class="text-right">{format(subDistrictCount[subCode])}</td>
    </tr>
    {/each}
  </table>

  <table class="tableborder">
    <tr>
      {#if hasSubdisctrics}
      <th class="text-left">Subdistrict</th>
      {/if}
      <th class="text-left">Sect</th>
      <th class="text-left">Candidate Name</th>
      <th>Votes</th>
      <th>Preferrential %</th>
      <th>Win</th>
      <th>Loss By Coalition</th>
      <th>Loss By Group</th>
    </tr>
    {#each processedCandidates as pCand}
    {#if !pCand.excludedByQuota || showExcluded}
    <tr class:bg-gray-100={pCand.excludedByQuota}>
      {#if hasSubdisctrics}
      <td class:text-red-500={groups[pCand.group] === undefined}>
        {groups[pCand.group]?.subdistrict ?? 'Undefined'}
      </td>
      {/if}
      <td class:text-red-500={groups[pCand.group] === undefined}>
        {groups[pCand.group]?.sect ?? 'Undefined'}
      </td>
      <td><div class="coalitionbadge" style="background-color: {coalitions[pCand.coalitionIndex].color}"></div>{pCand.name}</td>
      <td class="text-right">{format(pCand.votes)}</td>
      <td class="text-right">{format(pCand.preferentialPercent)}</td>
      <td class="text-center text-green-600">{@html pCand.win ? '&check;' : ''}</td>
      <td class="text-center font-bold text-red-500">{pCand.lossByCoalition ? 'X' : ''}</td>
      <td class="text-center font-bold text-red-500">{pCand.lossByGroup ? 'X' : ''}</td>
    </tr>
    {/if}
    {/each}
  </table>
  <button on:click={() => showExcluded = !showExcluded}>{showExcluded ? 'Hide' : 'Show'} Excluded Candidates</button>
  {/if}

  {/if}
</main>

