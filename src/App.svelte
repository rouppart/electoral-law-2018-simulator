<script lang="ts">
	import Tailwind from "./Tailwind.svelte";

	let seats: number = 1;
	let coalitions: Coalition[] = [];

	$: quotaPercent = Math.floor(100 / (seats + 1));
	$: totalActualVotes = coalitions.reduce((pV, cE) => pV + cE.votes, 0);

	function calculateQuota(seats: number, votes: number) {
		return Math.floor(votes / (seats + 1)) + 1;
	}

	$: initialQuota = calculateQuota(seats, totalActualVotes);

	function processVotes(seats: number, coalitions: Coalition[]) {
		let pCoals: ProcessedCoalition[] = coalitions.map(
				(e, i) => {return {...e, index: i, countedVotes: e.votes, fullSeats: 0, remainderVotes: 0, partialSeat: 0}}
		);
		pCoals.sort((a, b) => a.votes - b.votes);
		let totalCountedVotes = totalActualVotes;
		let currentQuota = initialQuota;
		const eliminatedCoalitions = [];

		// Eliminate and calculate full Seats and Remainder
		for (const pCoal of pCoals) {
			if (pCoal.votes < currentQuota) {
				pCoal.countedVotes = 0;
				const eliminatedCoalition: EliminatedCoalition = {...pCoal, eliminatingQuota: currentQuota};
				eliminatedCoalitions.push(eliminatedCoalition);
				totalCountedVotes -= eliminatedCoalition.votes;
				currentQuota = calculateQuota(seats, totalCountedVotes);
			} else {
				pCoal.fullSeats = Math.floor(pCoal.votes / currentQuota);
				pCoal.remainderVotes = pCoal.votes - pCoal.fullSeats * currentQuota;
			}
		}

		// Handle remainders
		pCoals.sort((a, b) => b.remainderVotes - a.remainderVotes);
		const partialSeats = seats - pCoals.reduce((pV, cE) => pV + cE.fullSeats, 0);
		for (let i = 0; i < partialSeats && i < pCoals.length; i++) {
			pCoals[i].partialSeat = 1;
		}

		// Prepare for return
		pCoals.sort((a, b) => a.index - b.index);
		return {processedCoalitions: pCoals, eliminatedCoalitions, totalCountedVotes, endQuota: currentQuota};
	}
	$: processedElection = processVotes(seats, coalitions);
	$: processedCoalitions = processedElection.processedCoalitions as ProcessedCoalition[];
	$: eleminatedCoalitions = processedElection.eliminatedCoalitions as EliminatedCoalition[];
	$: totalCountedVotes = processedElection.totalCountedVotes;
	$: endQuota = processedElection.endQuota;

	function addCoalition() {
		const newCoalition: Coalition = {name: '', votes: 0};
		coalitions = [...coalitions, newCoalition];
	}

	function deleteCoalition(index) {
		coalitions.splice(index, 1);
		coalitions = coalitions;
	}

	fetch("/samples/default.json")
		.then(response => response.json())
		.then(json => {
			seats = json['seats'];
			coalitions = json['coalitions'];
		})
</script>

<style lang="postcss">
	.coalitiongrid {
		display: grid;
		grid-template-columns: repeat(8, auto);
		align-items: center;
	}

	.header {
		@apply self-end font-bold tracking-tight;
	}
</style>

<Tailwind />

<main class="flex flex-col items-center space-y-4">

	<label>Seats <input type="number" class="w-20" bind:value={seats}></label>

	<div>
		<b>Quota %:</b> {quotaPercent}
	</div>

	<div>
		<b>Total Actual Votes:</b> {totalActualVotes}
	</div>

	<div>
		<b>Initial Quota:</b> {initialQuota}
	</div>

	<div class="border-2 border-red-400 p-3 grid grid-cols-2 gap-3">
		<span class="header">Eliminated Coalition</span>
		<span class="header">Eliminating Quota</span>
		{#each eleminatedCoalitions as eliminatedCoalition}
		<span>{eliminatedCoalition.name}</span>
		<span>{eliminatedCoalition.eliminatingQuota}</span>
		{/each}
	</div>

	<div>
		<b>Total Counted Votes:</b> {totalCountedVotes}
	</div>

	<div>
		<b>End Quota:</b> {endQuota}
	</div>

	<div class="coalitiongrid gap-3">
		<span class="col-span-8 font-bold text-gray-500 text-right">V. = Votes; S. = Seats</span>

		<span class="header">Coalition Name</span>
		<span class="header">Actual V.</span>
		<span class="header">Counted V.</span>
		<span class="header">Full S.</span>
		<span class="header">Remainder V.</span>
		<span class="header">Partial S.</span>
		<span class="header">Total S.</span>
		<span></span>
		{#each processedCoalitions as pCoal}
		<input type="text" bind:value={coalitions[pCoal.index].name}>
		<input type="number" class="w-20" bind:value={coalitions[pCoal.index].votes}>
		<span>{pCoal.countedVotes}</span>
		<span class="font-bold">{pCoal.fullSeats}</span>
		<span>{pCoal.remainderVotes}</span>
		<span class="font-bold">{pCoal.partialSeat}</span>
		<span class="font-bold text-green-600">{pCoal.fullSeats + pCoal.partialSeat}</span>
		<button on:click={deleteCoalition.bind(null, pCoal.index)}>X</button>
		{/each}
		<div>
			<button on:click={addCoalition} class="w-max">Add Coalition</button>
		</div>
	</div>
</main>

