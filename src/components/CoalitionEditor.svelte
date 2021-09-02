<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let coalition: Coalition
  export let groups: Groups
  export let index: number

  $: preferrentialVotes = coalition.candidates.reduce((pv, ce) => pv + ce.votes, 0);
  $: lowVotesWarning = preferrentialVotes > coalition.votes;

  function addCandidate() {
    coalition.candidates = [...coalition.candidates, {name: '', votes: 0, group: null}];
  }

  function deleteCandidate(index: number) {
		coalition.candidates.splice(index, 1);
		coalition.candidates = coalition.candidates;
	}

  function getGroupName(group: Group): string {
    return (group.subdistrict ? group.subdistrict + ' - ' : '') + group.sect;
  }
</script>


<style lang="postcss">
</style>

<table class="p-2 border-2" style="border-color: {coalition.color}" >
  <tr>
    <th>Coalition Name</th>
    <th>Color</th>
    <th>Votes</th>
    <th class="border-2">{index + 1}</th>
  </tr>
  <tr class="border-b-2">
    <td><input type="text" bind:value={coalition.name}></td>
    <td class="text-center"><input class="w-36" type="text" bind:value={coalition.color}></td>
    <td class:errortext={lowVotesWarning}><input type="number" class="w-20 text-right" bind:value={coalition.votes}></td>
    <td><button class="deletebutton" on:click={() => dispatch('deletecoalition', index)}>X</button></td>
  </tr>
  <tr>
    <th>Candidate Name</th>
    <th>Group</th>
    <th>Votes</th>
    <th></th>
  </tr>
  {#each coalition.candidates as candidate, i}
  <tr>
    <td><input type="text" bind:value={candidate.name}></td>
    <td>
      <select bind:value={candidate.group} class:errorborder={candidate.group === null}>
        <option value={null}>Select Group</option>
        {#each Object.keys(groups) as groupCode}
        <option value={groupCode}>{getGroupName(groups[groupCode])}</option>
        {/each}
      </select>
    </td>
    <td><input type="number" class="w-20 text-right" bind:value={candidate.votes}></td>
    <td><button class="deletebutton" on:click={deleteCandidate.bind(null, i)}>X</button></td>
  </tr>
  {/each}
  <tr>
    <td class="text-center">
      <button on:click={addCandidate}>Add Candidate</button>
    </td>
    <th>
      Preferential Votes:
    </th>
    <td class="text-right" class:errortext={lowVotesWarning}>{preferrentialVotes}</td>
  </tr>
</table>