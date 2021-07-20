import ethers from 'ethers';
import express from 'express';
import chalk from 'chalk';

const app = express();

const data = {
  WBNB: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', //wbnb 
  to_PURCHASE: '0x11582ef4642b1e7f0a023804b497656e2663bc9b',  // token to purchase = BUSD for test
  // 0xAD7A67A98426672CbB73a7E00d0252bF1545D8D4 Brother Chibi
  // 0xe9e7cea3dedca5984780bafc599bd69add087d56 BUSD
  factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',  //PancakeSwap V2 factory
  router: '0x10ED43C718714eb63d5aA57B78B54704E256024E', //PancakeSwap V2 router
  // recipient: '0x53d16349E55FeCA2ee3436cAdD4EB50479F48D3d', // ME #1 //Recipient wallet address,
  recipient: '0xb7E06e100628a379F6E86549749534948Aa64e1b', // ME #2 

  AMOUNT_OF_WBNB : '0.0002',
  Slippage : '20', //in Percentage
  gasPrice : '6', //in gwei
  gasLimit : '345684' //at least 21000
}

let initialLiquidityDetected = false;

const bscMainnetUrl = 'https://bsc-dataseed.binance.org/'; //ankr or quiknode
const privatekey = '66ad20ae2b211eaa5ccf7d500dab77ea6bc6add928f1d90d08016869e54a114f'; //without 0
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
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
  ],
  account
);

const run = async () => {
  const tokenIn = data.WBNB;
  const tokenOut = data.to_PURCHASE;
  const pairAddress = await factory.getPair(tokenIn, tokenOut);

  console.log(pairAddress);

  const pair = new ethers.Contract(pairAddress, ['event Mint(address indexed sender, uint amount0, uint amount1)'], account);

  pair.on('Mint', async (sender, amount0, amount1) => {
    if(initialLiquidityDetected === true) {
        return;
    }

    initialLiquidityDetected = true;

   //We buy x amount of the new token for our wbnb
   const amountIn = ethers.utils.parseUnits(`${data.AMOUNT_OF_WBNB}`, 'ether');
   const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
 
   //Our execution price will be a bit different, we need some flexbility
   const amountOutMin = amounts[1].sub(amounts[1].div(`${data.Slippage}`)); 
 
   console.log(
    chalk.green.inverse(`Liquidity Addition Detected at ${Date.now()} \n`)
     +
     `Buying Token
     =================
     tokenIn: ${amountIn.toString()} ${tokenIn} (WBNB)
     tokenOut: ${amountOutMin.toString()} ${tokenOut}
   `);

   console.log('Processing Transaction.....');
   console.log(chalk.yellow(`amountIn: ${amountIn}`));
   console.log(chalk.yellow(`amountOutMin: ${amountOutMin}`));
   console.log(chalk.yellow(`tokenIn: ${tokenIn}`));
   console.log(chalk.yellow(`tokenOut: ${tokenOut}`));
   console.log(chalk.yellow(`data.recipient: ${data.recipient}`));
   console.log(chalk.yellow(`data.gasLimit: ${data.gasLimit}`));
   console.log(chalk.yellow(`data.gasPrice: ${ethers.utils.parseUnits(`${data.gasPrice}`, 'gwei')}`));

   const tx = await router.swapExactTokensForTokens(
     amountIn,
     amountOutMin,
     [tokenIn, tokenOut],
     data.recipient,
     Date.now() + 1000 * 60 * 10, //10 minutes
     {
       'gasLimit': data.gasLimit,
       'gasPrice': ethers.utils.parseUnits(`${data.gasPrice}`, 'gwei')
   });

   // const tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
   //   amountIn,
   //   amountOutMin,
   //   [tokenIn, tokenOut],
   //   data.recipient,
   //   Date.now() + 1000 * 60 * 10, //10 minutes
   //   {
   //     'gasLimit': data.gasLimit,
   //     'gasPrice': ethers.utils.parseUnits(`${data.gasPrice}`, 'gwei')
   // });
 
   const receipt = await tx.wait(); 
   console.log('Transaction receipt');
   console.log(receipt);
  });
}

run();

const PORT = 5000;

app.listen(PORT, (console.log(chalk.yellow(`Listening for Liquidity Addition to token ${data.to_PURCHASE}`))));
