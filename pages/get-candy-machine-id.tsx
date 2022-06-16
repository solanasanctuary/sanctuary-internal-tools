import styles from "../styles/Home.module.css";

export default function SearchCandyMachineID() {

  const handleSubmit = async (event: any) => {
    
    event.preventDefault()
    const data = {
      inputAddress: event.target.inputAddress.value,
    }
    const JSONdata = JSON.stringify(data)
    const apiEndpoint = 'api/candy-machine-api';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSONdata,
    }
    const response = await fetch(apiEndpoint, options);
    const result = await response.json();
    
    if (response.status == 200) {

      alert(`The Candy Machine ID of your NFT, minted through Candy Machine Program V${result.candyMachineVersion} is ---> 
      ${result.candyMachineID}`)

    } else {
      alert(`${result.candyMachineID}`)
    }
  }

  return (
  <div className={styles.container}>
    <div className={styles.card}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Candy Machine ID Finder
        </h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="inputAddress" ></label>
          <input type="text" id="inputAddress" name="inputAddress"
          placeholder="Input the NFT token address" required />
          <button type="submit">Submit</button>
      </form>
      </main>
    </div>
  </div>
);
};
