<!DOCTYPE html>
<html>
<head>
  	<meta charset="utf-8">
  	<meta name="viewport" content="initial-scale=1, width=device-width">
  	
  	
  	<link rel="stylesheet" href="./global.css" />
  	<link rel="stylesheet"  href="./index.css" />
  	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" />
  	
  	
  	
</head>
<body>
  	
  	<div class="main">
    		<div class="main-child">
    		</div>
    		<div class="line-parent">
      			<div class="frame-child">
      			</div>
      			<div class="frame-parent">
        				<div class="frame-group">
          					<div class="frame-wrapper">
            						<div class="frame-container">
              							<div class="upcoming-times-wrapper">
                								<div class="upcoming-times">Upcoming Times</div>
              							</div>
            						</div>
          					</div>
          					<div class="frame-div">
            						<div class="subtract-parent">
              							<img class="subtract-parent" alt="" src="Subtract.svg">
              							
              							<div class="am-parent">
                								<div class="am">11:05 AM</div>
                								<div class="decide-by-10am-container">
                  									<span class="decide-by-10am-container1">
                    										<p class="decide-by">Decide by</p>
                    										<p class="decide-by">10AM</p>
                  									</span>
                								</div>
              							</div>
              							<div class="frame-wrapper1">
                								<div class="join-wrapper">
                  									<div class="join">Join</div>
                								</div>
              							</div>
            						</div>
            						<div class="subtract-group" id="frameContainer1">
              							<img class="subtract-parent" alt="" src="Subtract.svg">
              							
              							<div class="am-parent">
                								<div class="pm">2:05 PM</div>
                								<div class="decide-by-1pm-container">
                  									<span class="decide-by-10am-container1">
                    										<p class="decide-by">Decide by</p>
                    										<p class="decide-by">1PM</p>
                  									</span>
                								</div>
              							</div>
              							<div class="frame-wrapper1">
                								<div class="join-wrapper">
                  									<div class="join">Join</div>
                								</div>
              							</div>
            						</div>
            						<div class="subtract-parent">
              							<img class="subtract-parent" alt="" src="Subtract.svg">
              							
              							<div class="pm-group">
                								<div class="pm2">5:05 PM</div>
                								<div class="decide-by-4pm-container">
                  									<span class="decide-by-10am-container1">
                    										<p class="decide-by">Decide by</p>
                    										<p class="decide-by">4PM</p>
                  									</span>
                								</div>
              							</div>
              							<div class="frame-wrapper1">
                								<div class="join-wrapper">
                  									<div class="join">Join</div>
                								</div>
              							</div>
            						</div>
          					</div>
        				</div>
        				<div class="availability-resets-at">Availability resets at 8PM each day</div>
      			</div>
      			<div class="frame-wrapper4">
        				<div class="frame-parent1">
          					<div class="frame-parent2">
            						<div class="frame-wrapper5">
              							<div class="frame-parent3">
                								<img class="frame-item" alt="" src="Frame 1686562803.png">
                								
                								<div class="update-preferences-curious-abo-wrapper">
                  									<div class="update-preferences-curious-container">
                    										<span>
                      											<p class="decide-by">
                        												<b>Update Preferences</b>
                      											</p>
                      											<p class="decide-by">Curious about other communities?</p>
                    										</span>
                  									</div>
                								</div>
              							</div>
            						</div>
            						<div class="frame-wrapper5">
              							<div class="frame-parent3">
                								<div class="navigationarrow-wrapper">
                  									<div class="navigationarrow">
                    										<img class="vector-icon" alt="" src="Vector.svg">
                    										
                  									</div>
                								</div>
                								<div class="update-preferences-curious-abo-wrapper">
                  									<div class="update-preferences-curious-container">
                    										<span>
                      											<p class="decide-by">
                        												<b class="approximate-area">Approximate Area: </b>
                        												<span>Old Union</span>
                      											</p>
                      											<p class="decide-by">Exact spot is revealed 1hr before start</p>
                    										</span>
                  									</div>
                								</div>
              							</div>
            						</div>
          					</div>
          					<img class="image-4-icon" alt="" src="image 4.png">
          					
        				</div>
      			</div>
    		</div>
    		<div class="main-inner">
      			<div class="frame-parent5">
        				<div class="todays-circles-parent">
          					<div class="todays-circles">Today’s Circles</div>
          					<div class="new-conversations-waiting">New conversations waiting to happen</div>
        				</div>
        				<div class="frame-wrapper7">
          					<div class="gear-wrapper">
            						<div class="gear">
              							<img class="vector-icon1" alt="" src="Vector.svg">
              							
              							<img class="vector-icon2" alt="" src="Vector.svg">
              							
              							<img class="vector-icon3" alt="" src="Vector.svg">
              							
            						</div>
          					</div>
        				</div>
      			</div>
    		</div>
  	</div>
  	
  	
  	
  	
  	<script>
    		var frameContainer1 = document.getElementById("frameContainer1");
    		if(frameContainer1) {
      			frameContainer1.addEventListener("click", function (e) {
        				// Add your code here
      			});
    		}</script></body>
</html>

.main-child {
  	position: absolute;
  	top: 0rem;
  	left: 0rem;
  	background-color: var(--color-darkslateblue-300);
  	width: 24.375rem;
  	height: 13.188rem;
}
.frame-child {
  	width: 21.625rem;
  	position: relative;
  	border-top: 1px solid var(--color-darkslateblue-400);
  	box-sizing: border-box;
  	height: 0.063rem;
}
.upcoming-times {
  	position: relative;
  	letter-spacing: 0.1px;
  	line-height: 1.25rem;
}
.upcoming-times-wrapper {
  	align-self: stretch;
  	display: flex;
  	flex-direction: row;
  	align-items: center;
  	justify-content: flex-start;
}
.frame-container {
  	width: 21.563rem;
  	display: flex;
  	flex-direction: column;
  	align-items: flex-start;
  	justify-content: flex-start;
}
.frame-wrapper {
  	width: 24.375rem;
  	display: flex;
  	flex-direction: column;
  	align-items: center;
  	justify-content: center;
}
.am {
  	width: 6rem;
  	position: relative;
  	line-height: 1.75rem;
  	display: flex;
  	align-items: center;
  	flex-shrink: 0;
}
.decide-by {
  	margin: 0;
}
.decide-by-10am-container1 {
  	width: 100%;
}
.decide-by-10am-container {
  	width: 6.313rem;
  	position: relative;
  	font-size: var(--font-size-11);
  	letter-spacing: 0.5px;
  	line-height: 1rem;
  	color: var(--color-slategray);
  	text-align: center;
  	display: flex;
  	align-items: center;
  	flex-shrink: 0;
}
.am-parent {
  	position: absolute;
  	top: -0.031rem;
  	left: -0.031rem;
  	width: 15.625rem;
  	height: 3rem;
  	display: flex;
  	flex-direction: row;
  	align-items: center;
  	justify-content: flex-start;
  	padding: 0rem var(--padding-10) 0rem var(--padding-15);
  	box-sizing: border-box;
  	gap: 1.562rem;
}
.join {
  	position: relative;
  	letter-spacing: 0.25px;
  	line-height: 1.25rem;
}
.join-wrapper {
  	width: 3.438rem;
  	border-radius: var(--br-100);
  	background-color: var(--color-darkslateblue-200);
  	height: 1.5rem;
  	display: flex;
  	flex-direction: row;
  	align-items: center;
  	justify-content: center;
  	padding: var(--padding-4) var(--padding-16);
  	box-sizing: border-box;
}
.frame-wrapper1 {
  	position: absolute;
  	top: -0.031rem;
  	left: 14.969rem;
  	width: 6.563rem;
  	height: 3rem;
  	display: flex;
  	flex-direction: column;
  	align-items: center;
  	justify-content: center;
  	text-align: left;
  	font-size: var(--font-size-14);
  	color: var(--color-white);
}
.subtract-parent {
  	width: 21.563rem;
  	position: relative;
  	height: 3rem;
}
.pm {
  	width: 5.875rem;
  	position: relative;
  	line-height: 1.75rem;
  	display: flex;
  	align-items: center;
  	flex-shrink: 0;
}
.decide-by-1pm-container {
  	width: 6.75rem;
  	position: relative;
  	font-size: var(--font-size-11);
  	letter-spacing: 0.5px;
  	line-height: 1rem;
  	color: var(--color-slategray);
  	text-align: center;
  	display: flex;
  	align-items: center;
  	flex-shrink: 0;
}
.subtract-group {
  	width: 21.563rem;
  	position: relative;
  	height: 3rem;
  	cursor: pointer;
}
.pm2 {
  	width: 5.938rem;
  	position: relative;
  	line-height: 1.75rem;
  	display: flex;
  	align-items: center;
  	flex-shrink: 0;
}
.decide-by-4pm-container {
  	width: 7.5rem;
  	position: relative;
  	font-size: var(--font-size-11);
  	letter-spacing: 0.5px;
  	line-height: 1rem;
  	color: var(--color-slategray);
  	text-align: center;
  	display: flex;
  	align-items: center;
  	flex-shrink: 0;
}
.pm-group {
  	position: absolute;
  	top: -0.031rem;
  	left: -0.031rem;
  	width: 15.625rem;
  	height: 3rem;
  	display: flex;
  	flex-direction: row;
  	align-items: center;
  	justify-content: flex-start;
  	padding: 0rem var(--padding-10) 0rem var(--padding-15);
  	box-sizing: border-box;
  	gap: 1.25rem;
}
.frame-div {
  	display: flex;
  	flex-direction: column;
  	align-items: flex-start;
  	justify-content: flex-start;
  	gap: var(--gap-15);
  	text-align: right;
  	font-size: var(--font-size-22);
}
.frame-group {
  	display: flex;
  	flex-direction: column;
  	align-items: center;
  	justify-content: flex-start;
  	gap: var(--gap-15);
}
.availability-resets-at {
  	position: relative;
  	font-size: var(--font-size-16);
  	line-height: 1.5rem;
  	text-align: center;
  	opacity: 0.6;
}
.frame-parent {
  	width: 24.5rem;
  	display: flex;
  	flex-direction: column;
  	align-items: center;
  	justify-content: flex-start;
  	gap: var(--gap-15);
}
.frame-item {
  	width: 2.625rem;
  	border-radius: var(--br-100);
  	height: 2.625rem;
  	object-fit: cover;
}
.update-preferences-curious-container {
  	align-self: stretch;
  	position: relative;
  	letter-spacing: 0.25px;
  	line-height: 1.25rem;
  	display: flex;
  	align-items: center;
  	height: 5.438rem;
  	flex-shrink: 0;
}
.update-preferences-curious-abo-wrapper {
  	flex: 1;
  	height: 2.625rem;
  	display: flex;
  	flex-direction: column;
  	align-items: flex-start;
  	justify-content: center;
}
.frame-parent3 {
  	flex: 1;
  	height: 3.125rem;
  	display: flex;
  	flex-direction: row;
  	align-items: center;
  	justify-content: center;
  	gap: var(--gap-16);
}
.frame-wrapper5 {
  	width: 21.375rem;
  	height: 3.125rem;
  	display: flex;
  	flex-direction: row;
  	align-items: flex-start;
  	justify-content: center;
}
.vector-icon {
  	position: absolute;
  	height: 79.58%;
  	width: 79.58%;
  	top: 16.43%;
  	right: 4%;
  	bottom: 3.98%;
  	left: 16.42%;
  	max-width: 100%;
  	overflow: hidden;
  	max-height: 100%;
}
.navigationarrow {
  	width: 1.5rem;
  	position: relative;
  	height: 1.5rem;
}
.navigationarrow-wrapper {
  	width: 2.625rem;
  	border-radius: var(--br-100);
  	background-color: var(--color-whitesmoke);
  	height: 2.625rem;
  	display: flex;
  	flex-direction: column;
  	align-items: center;
  	justify-content: center;
  	padding: var(--padding-8);
  	box-sizing: border-box;
}
.approximate-area {
  	font-family: var(--font-inter);
}
.frame-parent2 {
  	display: flex;
  	flex-direction: column;
  	align-items: flex-start;
  	justify-content: flex-start;
  	gap: 0.625rem;
}
.image-4-icon {
  	width: 19.75rem;
  	position: relative;
  	border-radius: 40px;
  	max-height: 100%;
  	object-fit: cover;
}
.frame-parent1 {
  	align-self: stretch;
  	display: flex;
  	flex-direction: column;
  	align-items: center;
  	justify-content: flex-start;
  	gap: var(--gap-15);
}
.frame-wrapper4 {
  	width: 22.5rem;
  	display: flex;
  	flex-direction: column;
  	align-items: center;
  	justify-content: flex-start;
  	font-size: var(--font-size-14);
}
.line-parent {
  	position: absolute;
  	top: 13.188rem;
  	left: 0rem;
  	width: 24.375rem;
  	display: flex;
  	flex-direction: column;
  	align-items: center;
  	justify-content: flex-start;
  	padding: 1.25rem 0rem 1.062rem;
  	box-sizing: border-box;
  	gap: var(--gap-15);
}
.todays-circles {
  	width: 13.75rem;
  	position: relative;
  	line-height: 2.5rem;
  	font-weight: 500;
  	display: flex;
  	align-items: center;
  	justify-content: center;
  	height: 1.688rem;
  	flex-shrink: 0;
}
.new-conversations-waiting {
  	width: 19.938rem;
  	position: relative;
  	font-size: var(--font-size-16);
  	letter-spacing: 0.15px;
  	line-height: 1.5rem;
  	display: flex;
  	align-items: center;
  	justify-content: center;
  	height: 1.5rem;
  	flex-shrink: 0;
  	opacity: 0.8;
}
.todays-circles-parent {
  	width: 21.563rem;
  	display: flex;
  	flex-direction: column;
  	align-items: center;
  	justify-content: center;
  	gap: var(--gap-15);
  	z-index: 0;
}
.vector-icon1 {
  	position: absolute;
  	height: 100%;
  	width: 100%;
  	top: 0%;
  	right: 0%;
  	bottom: 0%;
  	left: 0%;
  	max-width: 100%;
  	overflow: hidden;
  	max-height: 100%;
}
.vector-icon2 {
  	position: absolute;
  	height: 31.5%;
  	width: 31.5%;
  	top: 34.38%;
  	right: 34.12%;
  	bottom: 34.12%;
  	left: 34.38%;
  	max-width: 100%;
  	overflow: hidden;
  	max-height: 100%;
}
.vector-icon3 {
  	position: absolute;
  	height: 75.5%;
  	width: 75.5%;
  	top: 12.25%;
  	right: 12.25%;
  	bottom: 12.25%;
  	left: 12.25%;
  	max-width: 100%;
  	overflow: hidden;
  	max-height: 100%;
}
.gear {
  	width: 1.25rem;
  	position: relative;
  	height: 1.25rem;
}
.gear-wrapper {
  	position: absolute;
  	top: 0rem;
  	left: 0rem;
  	border-radius: var(--br-100);
  	background-color: var(--color-darkslateblue-100);
  	width: 2.625rem;
  	height: 2.625rem;
  	display: flex;
  	flex-direction: column;
  	align-items: center;
  	justify-content: center;
  	padding: var(--padding-8);
  	box-sizing: border-box;
}
.frame-wrapper7 {
  	width: 2.625rem;
  	margin: 0 !important;
  	position: absolute;
  	top: -0.031rem;
  	left: 18.75rem;
  	display: grid;
  	grid-template-rows: ;
  	grid-template-columns: ;
  	justify-content: start;
  	align-content: start;
  	column-gap: 10px;
  	z-index: 1;
}
.frame-parent5 {
  	position: absolute;
  	top: 4.188rem;
  	left: 1.5rem;
  	width: 21.375rem;
  	height: 8.938rem;
  	display: flex;
  	flex-direction: column;
  	align-items: center;
  	justify-content: center;
}
.main-inner {
  	position: absolute;
  	top: 0rem;
  	left: 0rem;
  	width: 24.375rem;
  	height: 13.125rem;
  	text-align: center;
  	font-size: 1.875rem;
  	color: var(--color-white);
}
.main {
  	width: 100%;
  	position: relative;
  	background-color: var(--color-white);
  	height: 52.75rem;
  	overflow: hidden;
  	text-align: left;
  	font-size: 1.125rem;
  	color: var(--color-darkslategray);
  	font-family: var(--font-inter);
}


body {
  	margin: 0;
  	line-height: normal;
}


:root {
  	
  	/* Color */
  	--color-darkslateblue-400: rgba(21, 43, 92, 0.5);
  	--color-darkslateblue-300: #152b5c;
  	--color-darkslateblue-200: #1a336a;
  	--color-darkslateblue-100: #1c3a7a;
  	--color-white: #fff;
  	--color-darkslategray: #444744;
  	--color-slategray: #6b7280;
  	--color-whitesmoke: #ebebeb;
  	
  	/* Gap */
  	--gap-15: 0.937rem;
  	--gap-16: 1rem;
  	
  	/* Padding */
  	--padding-4: 0.25rem;
  	--padding-8: 0.5rem;
  	--padding-10: 0.625rem;
  	--padding-15: 0.937rem;
  	--padding-16: 1rem;
  	
  	/* BorderRadius */
  	--br-100: 100px;
  	
  	/* Font */
  	--font-inter: Inter;
  	
  	/* FontSize */
  	--font-size-11: 0.687rem;
  	--font-size-14: 0.875rem;
  	--font-size-16: 1rem;
  	--font-size-22: 1.375rem;
  	
}