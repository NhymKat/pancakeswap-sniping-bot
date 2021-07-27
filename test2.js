import ethers from 'ethers';
import express from 'express';
import chalk from 'chalk';

const app = express();

const data = {
  WBNB: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', //wbnb 
    // to_PURCHASE: '0xe9e7cea3dedca5984780bafc599bd69add087d56',  // BUSD: token to purchase
  to_PURCHASE: '0x91f44af93f784ae7ce939913f45636ce3d864207', //TESTNET BUSD
    // factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',  //PancakeSwap V2 factory
  factory: '0x6725F303b657a9451d8BA641348b6761A6CC7a17', // TESTNEST Pancakeswap Factory
    // router: '0x10ED43C718714eb63d5aA57B78B54704E256024E', //PancakeSwap V2 router
  router: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1', 
  recipient: '0x53d16349E55FeCA2ee3436cAdD4EB50479F48D3d', // my wallet 1
  AMOUNT_OF_WBNB : '0.01', // 4 places including decimal point
  Slippage : '15', //in Percentage
  gasPrice : '60', //in gwei
  gasLimit : '3456840' //at least 21000
}

console.clear();
console.log(chalk.blue('######################################################################################################'));
console.log(chalk.blue('######################################################################################################'));
console.log(chalk.blue('##############')+chalk.yellow('                          NymKats Trade Genie - v0.1                      ')+chalk.blue('##############'));
console.log(chalk.blue('######################################################################################################'));
console.log(chalk.blue('######################################################################################################\n'));


   console.log('Configuration checks.....');
   console.log(chalk.yellow(`\nBuy Spend: ${data.AMOUNT_OF_WBNB}`));
   console.log(chalk.yellow(`Amount IN: ${ethers.utils.parseUnits(`${data.AMOUNT_OF_WBNB}`, 'ether')}\n`));
   console.log(chalk.yellow(`Slippage: ${data.Slippage} Gas price: ${data.gasPrice} | ${ethers.BigNumber.from(`${data.gasPrice}`)} | Limit: ${data.gasLimit} | ${ethers.BigNumber.from(`${data.gasLimit}`)} `));


let initialLiquidityDetected = false;
// const bscMainnetUrl = 'https://bsc-dataseed.binance.org/'; //BSC Mainnet
const bscMainnetUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545'; // BSC Testnet
const privatekey = '4dc4aee651c42fd79fcd7c2c1698597f65a3ac8eae13ded7314e59580a750a1c'; // MAINNET wallet 1 key
const provider = new ethers.providers.JsonRpcProvider(bscMainnetUrl)
const wallet = new ethers.Wallet(privatekey);
const account = wallet.connect(provider);

const factory = new ethers.Contract(
  data.factory,
  ['function getPair(address tokenA, address tokenB) external view returns (address pair)'],
  account
);

const router = new ethers.Contract(
  data.router,
  [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
  ],
  account
);

const run = async () => {
  const tokenIn = data.WBNB;
  const tokenOut = data.to_PURCHASE;
  // const pairAddress = await factory.getPair(tokenIn, tokenOut);
  // console.log(`Liquidity Pair Address: ${pairAddress}`);

  // const amountIn = ethers.utils.parseEther(`${data.AMOUNT_OF_WBNB}`);
  const amountIn = ethers.utils.parseEther("0.001");
  const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
  console.log(`amounts: ${amounts}`)

  const amountOutMin = amounts[1].sub(amounts[1].div(`${data.Slippage}`)); 

  try{
    const tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
      amountIn,
      amountOutMin,
      [tokenIn, tokenOut],
      data.recipient,
     Date.now() + 1000 * 60 * 10, //10 minutes
      {
        // 'gasLimit': ethers.utils.parseUnits(`${data.gasLimit}`),
        // 'gasPrice': ethers.utils.parseUnits(`${data.gasPrice}`, 'gwei')
        'gasLimit': 2140790,
        'gasPrice': ethers.utils.parseUnits('6', 'gwei')
    }).then((result) => {
      //const receipt = await tx.wait(); 
      console.log('Transaction receipt');
      console.log(result);
}, (error) => {
    console.log(error);
    // error.reason - The Revert reason; this is what you probably care about. :)
    // Additionally:
    // - error.address - the contract address
    // - error.args - [ BigNumber(1), BigNumber(2), BigNumber(3) ] in this case
    // - error.method - "someMethod()" in this case
    // - error.errorSignature - "Error(string)" (the EIP 838 sighash; supports future custom errors)
    // - error.errorArgs - The arguments passed into the error (more relevant post EIP 838 custom errors)
    // - error.transaction - The call transaction used
});
    // try {
    //   const receipt = await tx.wait(); 
    //   console.log('Transaction receipt');
    //   console.log(receipt);
    // } catch(e) {
    //   console.log(`Caught error at receipt: `, e.error);
    //   console.log(`\nerror dump:\n\n`, e);
    // }
  } catch(e) {
    console.log(`\nCaught error at transaction!error dump:\n\n`, e);
  }

}

// ERROR RESPONSE EXAMPLE
// contract.someMethod(1, 2, 3).then((result) => {
// }, (error) => {
//     console.log(error);
//     // error.reason - The Revert reason; this is what you probably care about. :)
//     // Additionally:
//     // - error.address - the contract address
//     // - error.args - [ BigNumber(1), BigNumber(2), BigNumber(3) ] in this case
//     // - error.method - "someMethod()" in this case
//     // - error.errorSignature - "Error(string)" (the EIP 838 sighash; supports future custom errors)
//     // - error.errorArgs - The arguments passed into the error (more relevant post EIP 838 custom errors)
//     // - error.transaction - The call transaction used
// });





// const run = async () => {
//   const tokenIn = data.WBNB;
//   const tokenOut = data.to_PURCHASE;
//   const pairAddress = await factory.getPair(tokenIn, tokenOut);

//   console.log(`Liquidity Pair Address: ${pairAddress}`);

//   const pair = new ethers.Contract(pairAddress, ['event Mint(address indexed sender, uint amount0, uint amount1)'], account);

//   pair.on('Mint', async (sender, amount0, amount1) => {
//     if(initialLiquidityDetected === true) {
//         return;
//     }

//     initialLiquidityDetected = true;

//    //We buy x amount of the new token for our wbnb
//    //const amountIn = ethers.utils.parseUnits(`${data.AMOUNT_OF_WBNB}`, 2);
//    const amountIn = ethers.utils.parseUnits('0.1', 'ether');

//    const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
 
//    //Our execution price will be a bit different, we need some flexbility
//    const amountOutMin = amounts[1].sub(amounts[1].div(`${data.Slippage}`)); 
 
//    console.log(
//     chalk.green.inverse(`Liquidity Addition Detected at ${Date.now()} \n`)
//      +
//      `Buying Token
//      =================
//      tokenIn: ${amountIn.toString()} ${tokenIn} (WBNB)
//      tokenOut: ${amountOutMin.toString()} ${tokenOut}
//    `);

//    console.log('Processing Transaction.....');
//    console.log(chalk.yellow(`amountIn: ${amountIn}`));
//    console.log(chalk.yellow(`amountOutMin: ${amountOutMin}`));
//    console.log(chalk.yellow(`tokenIn: ${tokenIn}`));
//    console.log(chalk.yellow(`tokenOut: ${tokenOut}`));
//    console.log(chalk.yellow(`data.recipient: ${data.recipient}`));
//    console.log(chalk.yellow(`data.gasLimit: ${ethers.utils.parseUnits(`${data.gasLimit}`,0)}`));
//    console.log(chalk.yellow(`data.gasPrice: ${ethers.utils.parseUnits(`${data.gasPrice}`,0)}`));

//    // const tx = await router.swapExactTokensForTokens(
//    //   amountIn,
//    //   amountOutMin,
//    //   [tokenIn, tokenOut],
//    //   data.recipient,
//    //   Date.now() + 1000 * 60 * 10, //10 minutes
//    //   {
//    //     'gasLimit': data.gasLimit,
//    //     'gasPrice': ethers.utils.parseUnits(`${data.gasPrice}`, 'gwei')
//    // });

//    const tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
//      amountIn,
//      amountOutMin,
//      [tokenIn, tokenOut],
//      data.recipient,
//      Date.now() + 1000 * 60 * 10, //10 minutes
//      {
//        'gasLimit': ethers.utils.parseUnits(`${data.gasLimit}`,5),
//        'gasPrice': ethers.utils.parseUnits(`${data.gasPrice}`, 'gwei')
//    });
 
//    const receipt = await tx.wait(); 
//    console.log('Transaction receipt');
//    console.log(receipt);
//   });
// }

run();

const PORT = 5000;

// app.listen(PORT, (console.log(chalk.yellow(`Listening for Liquidity Addition to token ${data.to_PURCHASE}`))));
