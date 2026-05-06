"use strict";
var Time = {
  getCurrentTime: function () {
    if (Date.now) return Date.now();
    else return new Date().valueOf();
  },
};
var Cast = {
  toInt: function (value) {
    if (value < 2147483648) return value | 0;
    else return Math.floor(value);
  },
};
var FormatType = { LONG_FORMAT: 0, SHORT_FORMAT: 1, SCIENTIFIC_NOTATION: 2 };
var Formatter = {
  formatNumberInternal: function (value) {
    if (value < 1e4) return "" + Cast.toInt(value);
    else if (value < 1e5) return (value / 1e3).toFixed(1) + "K";
    else if (value < 1e6) return Cast.toInt(value / 1e3) + "K";
    else if (value < 1e7) return (value / 1e6).toFixed(2) + "M";
    else if (value < 1e8) return (value / 1e6).toFixed(1) + "M";
    else if (value < 1e9) return Cast.toInt(value / 1e6) + "M";
    else if (value < 1e10) return (value / 1e9).toFixed(2) + "B";
    else if (value < 1e11) return (value / 1e9).toFixed(1) + "B";
    else if (value < 1e12) return Cast.toInt(value / 1e9) + "B";
    else if (value < 1e13) return (value / 1e12).toFixed(2) + "T";
    else if (value < 1e14) return (value / 1e12).toFixed(1) + "T";
    else if (value < 1e15) return Cast.toInt(value / 1e12) + "T";
    else if (value < 1e16) return (value / 1e15).toFixed(2) + "Qa";
    else if (value < 1e17) return (value / 1e15).toFixed(1) + "Qa";
    else if (value < 1e18) return Cast.toInt(value / 1e15) + "Qa";
    else if (value < 1e19) return (value / 1e18).toFixed(2) + "Qi";
    else if (value < 1e20) return (value / 1e18).toFixed(1) + "Qi";
    else if (value < 1e21) return Cast.toInt(value / 1e18) + "Qi";
    else if (value < 1e22) return (value / 1e21).toFixed(2) + "Sx";
    else if (value < 9.999999999999999e22)
      return (value / 1e21).toFixed(1) + "Sx";
    else if (value < 1e24) return Cast.toInt(value / 1e21) + "Sx";
    else if (value < 1e25) return (value / 1e24).toFixed(2) + "Sp";
    else if (value < 1e26) return (value / 1e24).toFixed(1) + "Sp";
    else if (value < 1e27) return Cast.toInt(value / 1e24) + "Sp";
    else if (value < 1e28) return (value / 1e27).toFixed(2) + "Oct";
    else if (value < 1e29) return (value / 1e27).toFixed(1) + "Oct";
    else if (value < 1e30) return Cast.toInt(value / 1e27) + "Oct";
    else if (value < 1e31) return (value / 1e30).toFixed(2) + "Non";
    else if (value < 1e32) return (value / 1e30).toFixed(1) + "Non";
    else if (value < 1e33) return Cast.toInt(value / 1e30) + "Non";
    else if (value < 1e34) return (value / 1e33).toFixed(2) + "Dec";
    else if (value < 1e35) return (value / 1e33).toFixed(1) + "Dec";
    else if (value < 1e36) return Cast.toInt(value / 1e33) + "Dec";
    return value.toExponential(3);
  },
  formatSmall: function (value) {
    if (value >= 0) return Formatter.formatNumberInternal(value);
    else return "-" + Formatter.formatNumberInternal(-value);
  },
  formatBig: function (n) {
    if (n > 1e20) return n.toExponential(3);
    var thouSeparator = ",",
      sign = n < 0 ? "-" : "",
      nn = Math.abs(+n || 0),
      i = parseInt(nn) + "",
      j = i.length > 3 ? i.length % 3 : 0;
    return (
      sign +
      (j ? i.substr(0, j) + thouSeparator : "") +
      i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator)
    );
  },
  formatScientific: function (n) {
    if (n < 1e4) return "" + Cast.toInt(n);
    else return n.toExponential(3);
  },
  formatNumber: function (value, formatType) {
    switch (formatType) {
      case FormatType.SHORT_FORMAT:
        return Formatter.formatSmall(value);
      case FormatType.SCIENTIFIC_NOTATION:
        return Formatter.formatScientific(value);
      case FormatType.LONG_FORMAT:
      default:
        return Formatter.formatBig(value);
    }
  },
  formatElapsedTime: function (milliseconds) {
    if (milliseconds < 0) return "Error: negative time";
    var millisPerHour = 1e3 * 60 * 60,
      hours = Cast.toInt(milliseconds / millisPerHour),
      minutes = Cast.toInt((milliseconds / 6e4) % 60),
      seconds = Cast.toInt((milliseconds / 1e3) % 60);
    return (
      (hours < 10 ? "0" : "") +
      hours +
      ":" +
      (minutes < 10 ? "0" : "") +
      minutes +
      ":" +
      (seconds < 10 ? "0" : "") +
      seconds
    );
  },
};
var EventTracker = {
  trackEvent: function (category, action) {
    if (typeof ganal != "undefined") ganal("send", "event", category, action);
  },
};
var Settings = {
  total: { initialValue: 5, rateMultiplierBonusPerFilledColumn: 2 },
  tick: {
    initialMillisPerTick: 600,
    prestigeFactor: 0.85,
    minimumMillisPerTick: 1e-5,
  },
  building: {
    unlockCount: 5,
    numBuildingRows: 11,
    numBuildingUpgrades: 21,
    baseUpgradePercent: 25,
    prestigeWaitMillis: 2e3,
    rateSettings: { ratePower: 4.3, rateMultiplier: 2 },
    costSettings: {
      basePower: 2.48,
      baseIncrement: 2,
      incModifier: 1.0012,
      initialBase: 6,
    },
  },
  autoPlay: { maxPurchasesPerTurn: 30 },
};
function BuildingGenerator() {
  this.requiredValues = [
    10, 25, 50, 75, 100, 125, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700,
    800, 900, 1e3, 1100, 1200,
  ];
}
BuildingGenerator.prototype.generateInitialBuildings = function () {
  var buildings = [];
  var i,
    buildingCount =
      Settings.building.numBuildingRows + Game.model.total.getVictoryCount();
  for (i = 0; i < buildingCount; i++)
    buildings.push(this.generateBuilding(i, 0));
  return buildings;
};
BuildingGenerator.prototype.generateBuilding = function (
  buildingIndex,
  prestigeCount
) {
  return new Building(
    buildingIndex,
    this.generateName(buildingIndex),
    this.generateRatePerBuilding(buildingIndex),
    this.generateCostSettings(buildingIndex),
    this.generateBuildingUpgrades(buildingIndex, prestigeCount)
  );
};
BuildingGenerator.prototype.generateName = function (buildingIndex) {
  return "Building " + (buildingIndex + 1);
};
BuildingGenerator.prototype.generateCostSettings = function (buildingIndex) {
  return {
    buildingBase: Math.pow(
      buildingIndex + 1,
      Settings.building.costSettings.initialBase
    ),
  };
};
BuildingGenerator.prototype.generateRatePerBuilding = function (buildingIndex) {
  var rateMultiplier = Settings.building.rateSettings.rateMultiplier,
    ratePower = Settings.building.rateSettings.ratePower;
  return (
    Cast.toInt(
      buildingIndex * rateMultiplier * Math.pow(buildingIndex + 1, ratePower)
    ) + 1
  );
};
BuildingGenerator.prototype.generateBuildingUpgrades = function (
  buildingIndex,
  prestigeCount
) {
  var upgrades = [],
    bonus = this.getBonus(prestigeCount);
  var i;
  for (i = 0; i < Settings.building.numBuildingUpgrades; i++)
    upgrades.push(
      new BuildingUpgrade(this.getUpgradeRequirement(buildingIndex, i), bonus)
    );
  return upgrades;
};
BuildingGenerator.prototype.getUpgradeRequirement = function (
  buildingIndex,
  upgradeIndex
) {
  var requirement =
    this.requiredValues[upgradeIndex] +
    (upgradeIndex + 1) * Game.model.total.getVictoryCount() * 2;
  return Math.round(requirement / 5) * 5;
};
BuildingGenerator.prototype.getBonus = function (prestigeCount) {
  return Settings.building.baseUpgradePercent * (prestigeCount + 1);
};
function Tick() {
  this.millisPerTick = Settings.tick.initialMillisPerTick;
  this.lastTickTime = Time.getCurrentTime();
  this.buildingPrestigeCount = 0;
}
Tick.prototype.onSaveLoad = function () {
  this.millisPerTick = Settings.tick.initialMillisPerTick;
  var i,
    prestigeBonuses =
      this.buildingPrestigeCount + Game.model.total.getVictoryCount();
  for (i = 0; i < prestigeBonuses; i++) this.calculateTickTimeForPrestige();
};
Tick.prototype.resetTickState = function () {
  this.millisPerTick = Settings.tick.initialMillisPerTick;
  this.lastTickTime = Time.getCurrentTime();
  this.buildingPrestigeCount = 0;
};
Tick.prototype.getMillisPerTick = function () {
  return this.millisPerTick;
};
Tick.prototype.getBuildingPrestigeCount = function () {
  return this.buildingPrestigeCount;
};
Tick.prototype.setBuildingPrestigeCount = function (buildingPrestigeCount) {
  this.buildingPrestigeCount = buildingPrestigeCount;
};
Tick.prototype.getLastTickTime = function () {
  return this.lastTickTime;
};
Tick.prototype.setLastTickTime = function (lastTickTime) {
  this.lastTickTime = lastTickTime;
  if (this.lastTickTime > Time.getCurrentTime())
    this.lastTickTime = Time.getCurrentTime();
};
Tick.prototype.onBuildingPrestige = function () {
  this.calculateTickTimeForPrestige();
  this.buildingPrestigeCount++;
};
Tick.prototype.calculateTickTimeForPrestige = function () {
  this.millisPerTick = Math.max(
    Settings.tick.minimumMillisPerTick,
    this.millisPerTick * Settings.tick.prestigeFactor
  );
};
Tick.prototype.getElapsedTicks = function () {
  var now = Time.getCurrentTime(),
    elapsedMillis = Math.max(0, now - this.lastTickTime);
  var elapsedTicks = Cast.toInt(elapsedMillis / this.millisPerTick);
  if (elapsedTicks > 0) this.lastTickTime = now;
  return elapsedTicks;
};
Tick.prototype.convertToValuePerSecond = function (valuePerTick) {
  var secondsPerTick = this.millisPerTick / 1e3;
  return valuePerTick / secondsPerTick;
};
function PurchaseCount() {
  this.count = 1;
}
PurchaseCount.prototype.resetPurchaseCount = function () {
  this.count = 1;
};
PurchaseCount.prototype.getCount = function () {
  return this.count;
};
PurchaseCount.prototype.setCount = function (count) {
  this.count = count;
};
function BuildingUpgrade(required, bonus) {
  this.required = required;
  this.bonus = bonus;
  this.purchased = false;
  this.locked = true;
}
BuildingUpgrade.prototype.resetBuildingUpgradeState = function () {
  this.purchased = false;
  this.locked = true;
};
BuildingUpgrade.prototype.getRequired = function () {
  return this.required;
};
BuildingUpgrade.prototype.getBonus = function () {
  return this.bonus;
};
BuildingUpgrade.prototype.isPurchased = function () {
  return this.purchased;
};
BuildingUpgrade.prototype.setPurchased = function (purchased) {
  this.purchased = purchased;
};
BuildingUpgrade.prototype.isLocked = function () {
  return this.locked;
};
BuildingUpgrade.prototype.setLocked = function (locked) {
  this.locked = locked;
};
function Building(
  buildingIndex,
  name,
  ratePerBuilding,
  costSettings,
  buildingUpgrades
) {
  this.name = name;
  this.ratePerBuilding = ratePerBuilding;
  this.costSettings = costSettings;
  this.buildingIndex = buildingIndex;
  this.buildingUpgrades = buildingUpgrades;
  this.count = 0;
  this.rate = 0;
  this.buildingLocked = true;
  this.readyToPrestige = false;
  this.prestigeReadyTime = 0;
  this.prestigeCount = 0;
  this.cost1 = 0;
  this.cost10 = 0;
  this.cost25 = 0;
  this.cost100 = 0;
  this.costNext = 0;
  this.nextUpgradeCount = 0;
  this.upgradesPurchased = 0;
  this.calculateForCountChange();
}
Building.prototype.resetBuildingState = function () {
  this.count = 0;
  this.rate = 0;
  this.readyToPrestige = false;
  this.prestigeReadyTime = 0;
  this.prestigeCount = 0;
  this.upgradesPurchased = 0;
  this.cost1 = 0;
  this.cost10 = 0;
  this.cost25 = 0;
  this.cost100 = 0;
  this.costNext = 0;
  this.calculateForCountChange();
  var i;
  for (i = 0; i < this.buildingUpgrades.length; i++)
    this.buildingUpgrades[i].resetBuildingUpgradeState();
  this.buildingLocked = Game.model.buildings.indexOf(this) > 0;
  if (!this.buildingLocked) this.buildingUpgrades[0].setLocked(false);
};
Building.prototype.getBuildingIndex = function () {
  return this.buildingIndex;
};
Building.prototype.getName = function () {
  return this.name;
};
Building.prototype.setName = function (name) {
  this.name = name;
};
Building.prototype.getCount = function () {
  return this.count;
};
Building.prototype.setCount = function (count) {
  this.count = count;
  this.calculateForCountChange();
};
Building.prototype.getRate = function () {
  return this.rate;
};
Building.prototype.getRateAtCount = function (count) {
  return this.ratePerBuilding * count;
};
Building.prototype.getRatePerBuilding = function () {
  return this.ratePerBuilding;
};
Building.prototype.getNextUpgradeCount = function () {
  return this.nextUpgradeCount;
};
Building.prototype.getPrestigeCount = function () {
  return this.prestigeCount;
};
Building.prototype.setPrestigeCount = function (prestigeCount) {
  this.prestigeCount = prestigeCount;
};
Building.prototype.getCost = function () {
  return this.getCostForCount(Game.model.purchaseCount.getCount());
};
Building.prototype.getBuildingUpgrades = function () {
  return this.buildingUpgrades;
};
Building.prototype.getUpgradesPurchased = function () {
  return this.upgradesPurchased;
};
Building.prototype.calculateUpgradesPurchased = function () {
  this.upgradesPurchased = 0;
  var i;
  for (i = 0; i < this.buildingUpgrades.length; i++)
    if (this.buildingUpgrades[i].isPurchased()) this.upgradesPurchased++;
    else break;
};
Building.prototype.getCostForCount = function (count) {
  switch (count) {
    case 1:
      return this.cost1;
    case 10:
      return this.cost10;
    case 25:
      return this.cost25;
    case 100:
      return this.cost100;
    case -1:
      return this.costNext;
  }
  console.log("Error - invalid count specified: " + count);
  return this.cost1;
};
Building.prototype.getCostForNext = function () {
  return this.costNext;
};
Building.prototype.purchase = function () {
  this.purchaseAmount(Game.model.purchaseCount.getCount());
};
Building.prototype.purchaseAmount = function (purchaseCount) {
  var cost = this.getCostForCount(purchaseCount);
  if (cost > Game.model.total.getValue()) return false;
  if (this.buildingLocked) return false;
  Game.model.total.decrementValue(cost);
  if (purchaseCount > 0) this.count += purchaseCount;
  else {
    if (this.nextUpgradeCount < 0) {
      console.log("next upgrade count error: " + this.nextUpgradeCount);
      return false;
    }
    this.count += this.nextUpgradeCount;
  }
  this.calculateForCountChange();
  var upgradePurchased = this.checkForUpgradeUnlockAndPurchase();
  if (this.count >= Settings.building.unlockCount) {
    var buildingIndex = Game.model.buildings.indexOf(this);
    if (
      buildingIndex != -1 &&
      buildingIndex + 1 < Game.model.buildings.length
    ) {
      var nextBuilding = Game.model.buildings[buildingIndex + 1];
      if (nextBuilding.isBuildingLocked()) {
        nextBuilding.setBuildingLocked(false);
        nextBuilding.getBuildingUpgrades()[0].setLocked(false);
      }
    }
  }
  Game.model.total.onBuildingPurchase();
  return upgradePurchased;
};
Building.prototype.checkForUpgradeUnlockAndPurchase = function () {
  var i,
    upgrade,
    upgradePurchased = false;
  for (i = 0; i < this.buildingUpgrades.length; i++) {
    upgrade = this.buildingUpgrades[i];
    if (upgrade.isPurchased()) continue;
    if (this.count >= this.buildingUpgrades[i].getRequired()) {
      upgrade.setLocked(false);
      upgrade.setPurchased(true);
      Game.model.total.incrementRateMultiplier(upgrade.getBonus());
      if (i == this.buildingUpgrades.length - 1) {
        this.readyToPrestige = true;
        this.prestigeReadyTime = Time.getCurrentTime();
      }
      this.upgradesPurchased++;
      upgradePurchased = true;
    }
    if (i == 0 || this.buildingUpgrades[i - 1].isPurchased())
      upgrade.setLocked(false);
  }
  if (upgradePurchased) {
    Game.model.columnStatusManager.onUpgradePurchase();
    Game.model.total.recalculatePurchasedUpgrades();
    return true;
  } else return false;
};
Building.prototype.isBuildingLocked = function () {
  return this.buildingLocked;
};
Building.prototype.setBuildingLocked = function (buildingLocked) {
  this.buildingLocked = buildingLocked;
};
Building.prototype.isReadyToPrestige = function () {
  return this.readyToPrestige;
};
Building.prototype.setReadyToPrestige = function (readyToPrestige) {
  this.readyToPrestige = readyToPrestige;
};
Building.prototype.getPrestigeReadyTime = function () {
  return this.prestigeReadyTime;
};
Building.prototype.prestigeBuilding = function () {
  if (!this.readyToPrestige) return;
  var index = Game.model.buildings.indexOf(this);
  if (index < 0) {
    console.log("ERROR: failed to find building to retire!");
    return;
  }
  var prestige = this.prestigeCount + 1;
  var newBuilding = Game.buildingGenerator.generateBuilding(
    prestige * Game.model.buildings.length + index,
    prestige
  );
  newBuilding.setBuildingLocked(false);
  newBuilding.setPrestigeCount(prestige);
  Game.model.buildings[index] = newBuilding;
  Game.model.tick.onBuildingPrestige();
  Game.model.total.onBuildingPrestige();
  Game.model.columnStatusManager.onBuildingPrestige();
  EventTracker.trackEvent(
    "BASIC Building",
    "Prestige! index=" + newBuilding.getBuildingIndex() + " count=" + prestige
  );
};
Building.prototype.calculateForCountChange = function () {
  this.rate = this.ratePerBuilding * this.count;
  this.nextUpgradeCount = this.calculateNextUpgradeCount();
  var i,
    buildingCount = this.count + 1,
    cost = 0,
    maxCount = Math.max(100, this.nextUpgradeCount);
  for (i = 0; i < maxCount; i++) {
    cost += this.calculateCostForBuildingAtCount(buildingCount);
    buildingCount++;
    if (i + 1 === 1) this.cost1 = cost;
    else if (i + 1 === 10) this.cost10 = cost;
    else if (i + 1 === 25) this.cost25 = cost;
    else if (i + 1 === 100) this.cost100 = cost;
    if (i + 1 === this.nextUpgradeCount) this.costNext = cost;
  }
};
Building.prototype.calculateCostForBuildingAtCount = function (buildingCount) {
  var costSettings = Settings.building.costSettings,
    buildingBase = this.costSettings.buildingBase,
    baseIncrement = costSettings.baseIncrement,
    basePower = costSettings.basePower,
    incModifier = costSettings.incModifier;
  return Cast.toInt(
    (buildingBase + baseIncrement) *
      Math.pow(buildingCount, basePower) *
      Math.pow(incModifier, buildingCount)
  );
};
Building.prototype.calculateNextUpgradeCount = function () {
  var i, upgrade;
  for (i = 0; i < this.buildingUpgrades.length; i++) {
    upgrade = this.buildingUpgrades[i];
    if (!upgrade.isPurchased() && upgrade.getRequired() > this.count)
      return upgrade.getRequired() - this.count;
  }
  return -1;
};
function Total() {
  this.value = Settings.total.initialValue;
  this.rateMultiplier = 0;
  this.columnStatusBonus = 0;
  this.buildingRate = 0;
  this.victoryCount = 0;
  this.gameStartTime = 0;
  this.gameEndTime = 0;
  this.purchasedUpgradeCount = 0;
}
Total.prototype.onSaveLoad = function () {
  this.buildingRate = this.calculateCurrentRate();
  this.recalculatePurchasedUpgrades();
};
Total.prototype.resetTotalState = function () {
  this.value = Settings.total.initialValue;
  this.buildingRate = 0;
  this.rateMultiplier = 0;
  this.columnStatusBonus = 0;
  this.gameStartTime = Time.getCurrentTime();
  this.gameEndTime = 0;
  this.purchasedUpgradeCount = 0;
};
Total.prototype.getValue = function () {
  return this.value;
};
Total.prototype.setValue = function (value) {
  this.value = value;
};
Total.prototype.decrementValue = function (countAmount) {
  this.value -= countAmount;
  if (this.value < 0) this.value = 0;
};
Total.prototype.getRate = function () {
  return Cast.toInt(this.buildingRate * this.getTotalRateMultiplier());
};
Total.prototype.getTotalRateMultiplier = function () {
  return 1 + this.rateMultiplier + this.columnStatusBonus;
};
Total.prototype.getRateMultiplier = function () {
  return this.rateMultiplier;
};
Total.prototype.setRateMultiplier = function (rateMultiplier) {
  this.rateMultiplier = rateMultiplier;
};
Total.prototype.incrementRateMultiplier = function (ratePercent) {
  this.rateMultiplier += ratePercent / 100;
};
Total.prototype.onStatusColumnChange = function () {
  this.columnStatusBonus = 0;
  var i,
    columns = Game.model.columnStatusManager.getColumnStatusList();
  for (i = 0; i < columns.length; i++) {
    if (!columns[i].isFilled()) break;
    this.columnStatusBonus += columns[i].getColumnStatusBonus();
  }
};
Total.prototype.recalculatePurchasedUpgrades = function () {
  this.purchasedUpgradeCount = 0;
  var i;
  for (i = 0; i < Game.model.buildings.length; i++)
    this.purchasedUpgradeCount +=
      Game.model.buildings[i].getUpgradesPurchased();
};
Total.prototype.getPurchasedUpgradeCount = function () {
  return this.purchasedUpgradeCount;
};
Total.prototype.getBonusPercent = function () {
  return (this.rateMultiplier + this.columnStatusBonus) * 100;
};
Total.prototype.updateForFrame = function (elapsedTicks) {
  if (elapsedTicks > 0) this.value += this.getRate() * elapsedTicks;
};
Total.prototype.onBuildingPurchase = function () {
  this.buildingRate = this.calculateCurrentRate();
};
Total.prototype.onBuildingPrestige = function () {
  this.buildingRate = this.calculateCurrentRate();
  this.recalculatePurchasedUpgrades();
};
Total.prototype.calculateCurrentRate = function () {
  var i,
    rate = 0;
  for (i = 0; i < Game.model.buildings.length; i++)
    rate += Game.model.buildings[i].getRate();
  return rate;
};
Total.prototype.getVictoryCount = function () {
  return this.victoryCount;
};
Total.prototype.setVictoryCount = function (victoryCount) {
  this.victoryCount = victoryCount;
};
Total.prototype.onGameVictory = function () {
  this.victoryCount++;
  this.gameEndTime = Time.getCurrentTime();
};
Total.prototype.getGameStartTime = function () {
  return this.gameStartTime;
};
Total.prototype.setGameStartTime = function (gameStartTime) {
  this.gameStartTime = gameStartTime;
};
Total.prototype.getGameEndTime = function () {
  return this.gameEndTime;
};
Total.prototype.setGameEndTime = function (gameEndTime) {
  this.gameEndTime = gameEndTime;
};
function ColumnStatus(columnStatusBonus) {
  this.filled = false;
  this.columnStatusBonus = columnStatusBonus;
}
ColumnStatus.prototype.resetColumnStatus = function () {
  this.filled = false;
};
ColumnStatus.prototype.isFilled = function () {
  return this.filled;
};
ColumnStatus.prototype.setFilled = function (filled) {
  this.filled = filled;
};
ColumnStatus.prototype.getColumnStatusBonus = function () {
  return this.columnStatusBonus;
};
ColumnStatus.prototype.getColumnStatusBonusPercent = function () {
  return this.columnStatusBonus * 100;
};
function ColumnStatusManager() {
  this.columnStatusList = this.buildColumnStatusList();
  this.filledColumnCount = 0;
}
ColumnStatusManager.prototype.buildColumnStatusList = function () {
  var i,
    statusList = [],
    bonus = 0,
    bonusPerColumn = Settings.total.rateMultiplierBonusPerFilledColumn;
  for (i = 0; i < Settings.building.numBuildingUpgrades; i++) {
    bonus += bonusPerColumn;
    statusList.push(new ColumnStatus(bonus));
  }
  return statusList;
};
ColumnStatusManager.prototype.onSaveLoad = function () {
  this.calculateStatus();
};
ColumnStatusManager.prototype.resetColumnStatusManager = function () {
  this.resetColumnsToUnfilled();
  this.filledColumnCount = 0;
};
ColumnStatusManager.prototype.resetColumnsToUnfilled = function () {
  var i;
  for (i = 0; i < this.columnStatusList.length; i++)
    this.columnStatusList[i].resetColumnStatus();
};
ColumnStatusManager.prototype.getColumnStatusList = function () {
  return this.columnStatusList;
};
ColumnStatusManager.prototype.onUpgradePurchase = function () {
  this.calculateStatus();
};
ColumnStatusManager.prototype.onBuildingPrestige = function () {
  this.calculateStatus();
};
ColumnStatusManager.prototype.calculateStatus = function () {
  this.resetColumnsToUnfilled();
  var i,
    filled,
    filledColumnCount = 0;
  for (i = 0; i < Settings.building.numBuildingUpgrades; i++) {
    filled = this.isColumnFilled(i);
    this.columnStatusList[i].setFilled(filled);
    if (!filled) break;
    else filledColumnCount++;
  }
  if (this.filledColumnCount != filledColumnCount) {
    this.filledColumnCount = filledColumnCount;
    Game.model.total.onStatusColumnChange();
  }
};
ColumnStatusManager.prototype.isColumnFilled = function (columnIndex) {
  var i, buildingUpgrades;
  for (i = 0; i < Game.model.buildings.length; i++) {
    buildingUpgrades = Game.model.buildings[i].getBuildingUpgrades();
    if (!buildingUpgrades[columnIndex].isPurchased()) return false;
  }
  return true;
};
function AutoPlay() {
  this.buildingToUpgradeIndex = -1;
  this.overrideBuildingIndex = -1;
  this.overrideUpgradeIndex = -1;
}
AutoPlay.prototype.resetAutoPlayState = function () {
  this.buildingToUpgradeIndex = -1;
  this.overrideBuildingIndex = -1;
  this.overrideUpgradeIndex = -1;
};
AutoPlay.prototype.getBuildingToUpgradeIndex = function () {
  return this.buildingToUpgradeIndex;
};
AutoPlay.prototype.getOverrideBuildingIndex = function () {
  return this.overrideBuildingIndex;
};
AutoPlay.prototype.getOverrideUpgradeIndex = function () {
  return this.overrideUpgradeIndex;
};
AutoPlay.prototype.setOverrideIndices = function (
  overrideBuildingIndex,
  overrideUpgradeIndex
) {
  this.overrideBuildingIndex = overrideBuildingIndex;
  this.overrideUpgradeIndex = overrideUpgradeIndex;
};
AutoPlay.prototype.playTurn = function () {
  var purchased = this.purchaseBestBuilding(),
    count = 0;
  while (purchased && count < Settings.autoPlay.maxPurchasesPerTurn) {
    count++;
    purchased = this.purchaseBestBuilding();
  }
};
AutoPlay.prototype.purchaseBestBuilding = function () {
  this.buildingToUpgradeIndex = this.chooseBuildingIndex();
  if (this.buildingToUpgradeIndex > -1) {
    var building = Game.model.buildings[this.buildingToUpgradeIndex],
      totalMoney = Game.model.total.getValue();
    if (building.getCostForNext() <= totalMoney) {
      building.purchaseAmount(-1);
      if (this.isOverrideAssignmentCompleted()) {
        this.overrideBuildingIndex = -1;
        this.buildingToUpgradeIndex = -1;
      }
      return true;
    }
    if (building.getCostForCount(1) <= totalMoney) {
      if (building.purchaseAmount(1))
        if (this.isOverrideAssignmentCompleted()) {
          this.overrideBuildingIndex = -1;
          this.buildingToUpgradeIndex = -1;
        }
      return true;
    }
  }
  return false;
};
AutoPlay.prototype.isOverrideAssignmentCompleted = function () {
  if (this.overrideBuildingIndex > -1 && this.overrideUpgradeIndex > -1) {
    var building = Game.model.buildings[this.overrideBuildingIndex],
      upgrade = building.getBuildingUpgrades()[this.overrideUpgradeIndex];
    return building.isReadyToPrestige() || upgrade.isPurchased();
  } else return true;
};
AutoPlay.prototype.chooseBuildingIndex = function () {
  if (this.overrideBuildingIndex > -1 && this.overrideUpgradeIndex > -1)
    if (this.isOverrideAssignmentCompleted()) {
      this.overrideBuildingIndex = -1;
      this.overrideUpgradeIndex = -1;
    } else return this.overrideBuildingIndex;
  var i,
    bestBuildingIndex = -1,
    bestBuildingValue = -1,
    currentBuilding,
    currentValue;
  for (i = 0; i < Game.model.buildings.length; i++) {
    currentBuilding = Game.model.buildings[i];
    if (currentBuilding.isBuildingLocked()) continue;
    if (currentBuilding.isReadyToPrestige()) continue;
    if (currentBuilding.getCount() < Settings.building.unlockCount) return i;
    currentValue = this.calculateBuildingValue(currentBuilding);
    if (currentValue < 0) continue;
    if (bestBuildingIndex < 0 || bestBuildingValue < currentValue) {
      bestBuildingIndex = i;
      bestBuildingValue = currentValue;
    }
  }
  return bestBuildingIndex;
};
AutoPlay.prototype.calculateBuildingValue = function (building) {
  var nextUpgradeCount = building.getNextUpgradeCount();
  if (nextUpgradeCount < 0) return -1;
  var costForNext = building.getCostForNext();
  if (costForNext === 0) return 100;
  var rateImprovement = nextUpgradeCount * building.getRatePerBuilding();
  var timeRequiredToUpgrade = this.calculateTimeRequiredToUpgrade(costForNext);
  if (timeRequiredToUpgrade === 0) return rateImprovement / costForNext;
  return rateImprovement / costForNext / timeRequiredToUpgrade;
};
AutoPlay.prototype.calculateTimeRequiredToUpgrade = function (costToUpgrade) {
  var currentMoney = Game.model.total.getValue();
  if (currentMoney >= costToUpgrade) return 0;
  var rate = Game.model.total.getRate(),
    moneyNeeded = costToUpgrade - currentMoney;
  return moneyNeeded / rate;
};
var Page = {
  getElement: function (elementId) {
    return document.getElementById(elementId);
  },
  createElement: function (tagName, parent, id, className) {
    var element = document.createElement(tagName);
    if (className) element.className = className;
    if (id) element.id = id;
    if (parent) parent.appendChild(element);
    return element;
  },
  clearChildren: function (elementId) {
    var element = Page.getElement(elementId);
    if (element)
      while (element.firstChild) element.removeChild(element.firstChild);
  },
  hideElement: function (element) {
    if (element) element.style.display = "none";
  },
  showElement: function (element) {
    if (element) element.style.display = "block";
  },
  hideElementId: function (elementId) {
    Page.hideElement(Page.getElement(elementId));
  },
  showElementId: function (elementId) {
    Page.showElement(Page.getElement(elementId));
  },
};
function View() {}
View.prototype.initializeView = function () {};
View.prototype.updateView = function () {};
function BaseView() {
  this.containerId = null;
  this.pageElementVisible = false;
}
BaseView.prototype.getContainerId = function () {
  return this.containerId;
};
BaseView.prototype.setContainerId = function (containerId) {
  this.containerId = containerId;
};
BaseView.prototype.setPageElementVisible = function (pageElementVisible) {
  this.pageElementVisible = pageElementVisible;
};
BaseView.prototype.isViewVisible = function () {
  return this.viewVisible;
};
BaseView.prototype.setViewVisible = function (visible) {
  this.viewVisible = visible;
};
BaseView.prototype.updateView = function () {
  if (this.containerId) {
    var viewVisible = this.isViewVisible();
    if (this.pageElementVisible != viewVisible) {
      this.pageElementVisible = viewVisible;
      if (viewVisible) Page.showElementId(this.containerId);
      else Page.hideElementId(this.containerId);
    }
    if (viewVisible) this.updateViewContents();
  }
};
BaseView.prototype.initializeView = function () {};
BaseView.prototype.updateViewContents = function () {};
function ParentView() {
  this.childViews = null;
}
ParentView.prototype = new BaseView();
ParentView.prototype.clearChildViews = function () {
  if (this.childViews) this.childViews.length = 0;
};
ParentView.prototype.addView = function (view) {
  if (view) {
    if (!this.childViews) this.childViews = [];
    this.childViews.push(view);
  }
};
ParentView.prototype.initializeView = function () {
  this.invokeInitializeViewOnChildren();
};
ParentView.prototype.updateViewContents = function () {
  this.updateChildViews();
};
ParentView.prototype.updateChildViews = function () {
  if (this.childViews) {
    var i;
    for (i = 0; i < this.childViews.length; i++)
      this.childViews[i].updateView();
  }
};
ParentView.prototype.invokeInitializeViewOnChildren = function () {
  if (this.childViews) {
    var i;
    for (i = 0; i < this.childViews.length; i++)
      this.childViews[i].initializeView();
  }
};
function VictoryAwareParentView() {
  this.displayedVictory = false;
}
VictoryAwareParentView.prototype = new ParentView();
VictoryAwareParentView.prototype.handleViewInitialization = function () {
  this.setViewVisible(true);
  this.invokeInitializeViewOnChildren();
  this.displayedVictory = false;
};
VictoryAwareParentView.prototype.updateViewContents = function () {
  var victory = Game.gameWon;
  if (this.displayedVictory != victory) {
    if (victory) {
      this.setViewVisible(false);
      this.setPageElementVisible(false);
      Page.hideElementId(this.getContainerId());
      return;
    } else this.setViewVisible(true);
    this.displayedVictory = victory;
  }
  this.updateChildViews();
};
function TotalView() {
  this.setContainerId("currentStateContainer");
  this.setViewVisible(true);
  this.setPageElementVisible(true);
  this.displayedValue = -1;
  this.displayedRate = -1;
  this.displayedBonus = -1;
  this.displayedTick = -1;
  this.displayedTickRate = true;
  this.displayedRateLongFormat = true;
  this.displayedValueLongFormat = true;
  this.currentCountElement = null;
  this.currentRateElement = null;
  this.currentBonusElement = null;
  this.currentTickElement = null;
}
TotalView.prototype = new BaseView();
TotalView.prototype.initializeView = function () {
  this.currentCountElement = Page.getElement("currentValue");
  this.currentRateElement = Page.getElement("currentRate");
  this.currentBonusElement = Page.getElement("currentBonus");
  this.currentTickElement = Page.getElement("currentTick");
};
TotalView.prototype.updateViewContents = function () {
  var value = Game.model.total.getValue(),
    rate = Game.model.total.getRate(),
    bonus = Game.model.total.getBonusPercent(),
    tick = Game.model.tick.getMillisPerTick();
  if (!Game.configuration.displayTickRate)
    rate = Game.model.tick.convertToValuePerSecond(rate);
  if (
    this.displayedValue != value ||
    this.displayedValueLongFormat != Game.configuration.displayNumberFormat
  ) {
    this.displayedValue = value;
    this.displayedValueLongFormat = Game.configuration.displayNumberFormat;
    this.currentCountElement.innerHTML =
      "$" +
      Formatter.formatNumber(value, Game.configuration.displayNumberFormat);
  }
  if (
    this.displayedRate != rate ||
    this.displayedTickRate != Game.configuration.displayTickRate ||
    this.displayedRateLongFormat != Game.configuration.displayNumberFormat
  ) {
    this.displayedRate = rate;
    this.displayedTickRate = Game.configuration.displayTickRate;
    this.displayedRateLongFormat = Game.configuration.displayNumberFormat;
    if (Game.configuration.displayTickRate)
      this.currentRateElement.innerHTML =
        Formatter.formatNumber(rate, Game.configuration.displayNumberFormat) +
        " / tick";
    else
      this.currentRateElement.innerHTML =
        Formatter.formatNumber(rate, Game.configuration.displayNumberFormat) +
        " / sec";
  }
  if (this.displayedBonus != bonus) {
    this.displayedBonus = bonus;
    this.currentBonusElement.innerHTML = Formatter.formatBig(bonus) + "%";
  }
  if (this.displayedTick != tick) {
    this.displayedTick = tick;
    if (tick > 999)
      this.currentTickElement.innerHTML = Formatter.formatBig(tick) + " millis";
    else if (tick > 99)
      this.currentTickElement.innerHTML = tick.toFixed(1) + " millis";
    else if (tick > 9)
      this.currentTickElement.innerHTML = tick.toFixed(2) + " millis";
    else if (tick > 0.1)
      this.currentTickElement.innerHTML = tick.toFixed(3) + " ms";
    else if (tick > 0.01)
      this.currentTickElement.innerHTML = tick.toFixed(4) + " m";
    else if (tick > 0.001)
      this.currentTickElement.innerHTML = tick.toFixed(5) + " m";
    else this.currentTickElement.innerHTML = tick.toFixed(7);
  }
};
function PurchaseCountView() {
  this.setContainerId("placeHolder");
  this.setViewVisible(true);
  this.setPageElementVisible(true);
  this.purchaseCountButtons = null;
  this.counts = [1, 10, 25, 100, -1];
  this.buttonSelected = [false, false, false, false, false];
  this.currentCount = -100;
}
PurchaseCountView.prototype = new BaseView();
PurchaseCountView.prototype.initializeView = function () {
  this.purchaseCountButtons = [
    Page.getElement("purchaseCountButton1"),
    Page.getElement("purchaseCountButton10"),
    Page.getElement("purchaseCountButton25"),
    Page.getElement("purchaseCountButton100"),
    Page.getElement("purchaseCountButtonNext"),
  ];
  var thisRef = this;
  this.purchaseCountButtons[0].onmouseup = function () {
    thisRef.setPurchaseCount(0);
  };
  this.purchaseCountButtons[1].onmouseup = function () {
    thisRef.setPurchaseCount(1);
  };
  this.purchaseCountButtons[2].onmouseup = function () {
    thisRef.setPurchaseCount(2);
  };
  this.purchaseCountButtons[3].onmouseup = function () {
    thisRef.setPurchaseCount(3);
  };
  this.purchaseCountButtons[4].onmouseup = function () {
    thisRef.setPurchaseCount(4);
  };
  this.currentCount = -100;
};
PurchaseCountView.prototype.setPurchaseCount = function (index) {
  Game.model.purchaseCount.setCount(this.counts[index]);
};
PurchaseCountView.prototype.updateViewContents = function () {
  var i,
    count = Game.model.purchaseCount.getCount();
  if (this.currentCount != count) {
    for (i = 0; i < this.buttonSelected.length; i++)
      if (count === this.counts[i]) {
        if (!this.buttonSelected[i]) {
          this.purchaseCountButtons[i].className =
            "selected-game-button purchase-per-click-button";
          this.buttonSelected[i] = true;
        }
      } else if (this.buttonSelected[i]) {
        this.purchaseCountButtons[i].className =
          "game-button purchase-per-click-button";
        this.buttonSelected[i] = false;
      }
    this.currentCount = count;
  }
};
function HeaderRowView() {
  this.setContainerId("headerRowContainer");
  this.setViewVisible(true);
  this.addView(new TotalView());
  this.addView(new PurchaseCountView());
}
HeaderRowView.prototype = new VictoryAwareParentView();
HeaderRowView.prototype.initializeView = function () {
  this.handleViewInitialization();
};
function BuildingUpgradeView(containerId, buildingIndex, upgradeIndex) {
  this.setContainerId(containerId);
  this.setViewVisible(true);
  this.buildingIndex = buildingIndex;
  this.upgradeIndex = upgradeIndex;
  this.buttonDiv = null;
  this.displayedRequired = -1;
  this.displayedBonus = -1;
  this.lockedStatus = 0;
  this.unavailableStatus = 1;
  this.purchasedStatus = 2;
  this.autoPlayTargetStatus = 3;
  this.clickableUnavailableStatus = 4;
  this.overriddenTargetStatus = 5;
  this.clickableLockedStatus = 6;
  this.displayedStatus = this.lockedStatus;
}
BuildingUpgradeView.prototype = new BaseView();
BuildingUpgradeView.prototype.initializeView = function () {
  var parent = Page.getElement(this.getContainerId());
  this.buttonDiv = Page.createElement(
    "div",
    parent,
    null,
    "locked-game-button game-upgrade"
  );
  this.buttonDiv.title = "";
  this.displayedStatus = this.lockedStatus;
  var thisRef = this;
  this.buttonDiv.onmouseup = function () {
    thisRef.handleAutoPlayOverrideClick();
  };
};
BuildingUpgradeView.prototype.updateViewContents = function () {
  if (this.buildingIndex >= Game.model.buildings.length) {
    if (this.displayedStatus != this.lockedStatus) {
      this.buttonDiv.className = "locked-game-button game-upgrade";
      this.buttonDiv.title = "";
      this.displayedStatus = this.lockedStatus;
      this.clearButtonContents();
    }
    return;
  }
  var building = Game.model.buildings[this.buildingIndex],
    overrideBuildingIndex = Game.model.autoPlay.getOverrideBuildingIndex(),
    overrideUpgradeIndex = Game.model.autoPlay.getOverrideUpgradeIndex();
  if (!building) return;
  var upgrade = building.getBuildingUpgrades()[this.upgradeIndex];
  if (upgrade.isLocked()) {
    if (Game.configuration.autoPlayMode)
      if (
        this.buildingIndex === overrideBuildingIndex &&
        this.upgradeIndex <= overrideUpgradeIndex
      ) {
        if (this.displayedStatus != this.overriddenTargetStatus) {
          this.displayedStatus = this.overriddenTargetStatus;
          this.buttonDiv.className =
            "overridden-target-game-button game-upgrade";
          this.buttonDiv.title = "Overridden auto play upgrade target.";
        }
      } else {
        if (this.displayedStatus != this.clickableLockedStatus) {
          this.buttonDiv.className =
            "clickable-locked-game-button game-upgrade";
          this.buttonDiv.title =
            "Click to force auto play to target this upgrade.";
          this.displayedStatus = this.clickableLockedStatus;
          this.clearButtonContents();
        }
      }
    else if (this.displayedStatus != this.lockedStatus) {
      this.buttonDiv.className = "locked-game-button game-upgrade";
      this.buttonDiv.title = "";
      this.displayedStatus = this.lockedStatus;
      this.clearButtonContents();
    }
    return;
  }
  if (upgrade.isPurchased()) {
    if (this.displayedStatus != this.purchasedStatus) {
      this.buttonDiv.className = "purchased-game-button game-upgrade";
      this.buttonDiv.title = "";
      this.displayedStatus = this.purchasedStatus;
    }
    var bonus = upgrade.getBonus();
    if (this.displayedBonus != bonus) {
      this.displayedBonus = bonus;
      this.buttonDiv.innerHTML = Formatter.formatSmall(bonus) + "%";
      this.buttonDiv.title = "";
    }
  } else {
    if (Game.configuration.autoPlayMode)
      if (
        Game.model.autoPlay.getOverrideBuildingIndex() === this.buildingIndex
      ) {
        if (this.displayedStatus != this.overriddenTargetStatus) {
          this.displayedStatus = this.overriddenTargetStatus;
          this.buttonDiv.className =
            "overridden-target-game-button game-upgrade";
          this.buttonDiv.title = "Overridden auto play upgrade target.";
        }
      } else if (
        Game.model.autoPlay.getBuildingToUpgradeIndex() === this.buildingIndex
      ) {
        if (this.displayedStatus != this.autoPlayTargetStatus) {
          this.displayedStatus = this.autoPlayTargetStatus;
          this.buttonDiv.className = "targeted-game-button game-upgrade";
          this.buttonDiv.title = "Current auto play upgrade target.";
        }
      } else {
        if (this.displayedStatus != this.clickableUnavailableStatus) {
          this.displayedStatus = this.clickableUnavailableStatus;
          this.buttonDiv.className =
            "clickable-disabled-game-button game-upgrade";
          this.buttonDiv.title =
            "Click to force auto play to target this upgrade.";
        }
      }
    else if (this.displayedStatus != this.unavailableStatus) {
      this.displayedStatus = this.unavailableStatus;
      this.buttonDiv.className = "disabled-game-button game-upgrade";
      this.buttonDiv.title = "";
    }
    var required = upgrade.getRequired();
    if (this.displayedRequired != required) {
      this.buttonDiv.innerHTML = Formatter.formatSmall(required);
      this.displayedRequired = required;
    }
  }
};
BuildingUpgradeView.prototype.clearButtonContents = function () {
  this.buttonDiv.innerHTML = "";
  this.displayedRequired = -1;
  this.displayedBonus = -1;
};
BuildingUpgradeView.prototype.handleAutoPlayOverrideClick = function () {
  if (!Game.configuration.autoPlayMode) return;
  var building = Game.model.buildings[this.buildingIndex];
  if (!building || building.isBuildingLocked()) return;
  var upgrade = building.getBuildingUpgrades()[this.upgradeIndex];
  if (upgrade.isPurchased()) return;
  if (
    Game.model.autoPlay.getOverrideBuildingIndex() === this.buildingIndex &&
    Game.model.autoPlay.getOverrideUpgradeIndex() === this.upgradeIndex
  )
    Game.model.autoPlay.setOverrideIndices(-1, -1);
  else
    Game.model.autoPlay.setOverrideIndices(
      this.buildingIndex,
      this.upgradeIndex
    );
};
function BuildingView(containerId, buildingIndex) {
  this.setContainerId(containerId);
  this.setViewVisible(true);
  this.buildingIndex = buildingIndex;
  this.buttonDiv = null;
  this.progressSlider = null;
  this.nameCell = null;
  this.countCell = null;
  this.rateCell = null;
  this.costCell = null;
  this.progressSliderVisible = false;
  this.buttonWidth = 234;
  this.displayedProgress = -1;
  this.displayedName = null;
  this.displayedCount = -1;
  this.displayedRate = -1;
  this.displayedCost = -1;
  this.displayedTickRate = true;
  this.displayProgressSlider = Game.configuration.displayProgressSlider;
  this.lockedStatus = 0;
  this.enabledStatus = 1;
  this.disabledStatus = 2;
  this.readyToPrestigeStatus = 3;
  this.prestigeDelayStatus = 4;
  this.notRenderedStatus = 4;
  this.displayedStatus = this.lockedStatus;
  this.displayedRateFormat = FormatType.LONG_FORMAT;
  this.displayedCostFormat = FormatType.LONG_FORMAT;
}
BuildingView.prototype = new BaseView();
BuildingView.prototype.initializeView = function () {
  var parent = Page.getElement(this.getContainerId());
  var containerDiv = Page.createElement(
    "div",
    parent,
    null,
    "game-building-container"
  );
  this.progressSlider = Page.createElement(
    "div",
    containerDiv,
    null,
    "game-building-slider"
  );
  this.progressSliderVisible = false;
  this.buttonDiv = Page.createElement(
    "div",
    containerDiv,
    null,
    "locked-game-button game-building"
  );
  var paddingDiv = Page.createElement(
    "div",
    this.buttonDiv,
    null,
    "game-building-padding-div"
  );
  var table = Page.createElement("table", paddingDiv, null, null),
    topRow = table.insertRow(0),
    bottomRow = table.insertRow(1);
  this.nameCell = topRow.insertCell(0);
  this.costCell = topRow.insertCell(1);
  this.costCell.style.textAlign = "right";
  this.countCell = bottomRow.insertCell(0);
  this.rateCell = bottomRow.insertCell(1);
  this.rateCell.style.textAlign = "right";
  var thisRef = this;
  this.buttonDiv.onmouseup = function () {
    thisRef.handleButtonClick();
  };
};
BuildingView.prototype.updateViewContents = function () {
  if (this.buildingIndex >= Game.model.buildings.length) {
    if (this.disabledStatus != this.notRenderedStatus) {
      this.disabledStatus = this.notRenderedStatus;
      this.buttonDiv.className = "locked-game-button game-building";
      this.clearButtonContents();
    }
    return;
  }
  var building = Game.model.buildings[this.buildingIndex],
    rate = building.getRate() * Game.model.total.getTotalRateMultiplier(),
    cost = building.getCost(),
    count = building.getCount(),
    name = building.getName(),
    totalMoney = Game.model.total.getValue(),
    enabled = cost <= totalMoney;
  if (!Game.configuration.displayTickRate)
    rate = Game.model.tick.convertToValuePerSecond(rate);
  if (building.isBuildingLocked()) {
    if (this.displayedStatus != this.lockedStatus) {
      this.buttonDiv.className = "locked-game-button game-building";
      this.displayedStatus = this.lockedStatus;
      this.clearButtonContents();
    }
    if (this.progressSliderVisible) {
      Page.hideElement(this.progressSlider);
      this.progressSliderVisible = false;
    }
  } else if (building.isReadyToPrestige()) {
    var prestigeWaitTime =
        Time.getCurrentTime() - building.getPrestigeReadyTime(),
      waitingOnPrestige =
        prestigeWaitTime < Settings.building.prestigeWaitMillis;
    if (waitingOnPrestige) {
      if (this.disabledStatus != this.prestigeDelayStatus) {
        this.buttonDiv.className = "prestige-delay-game-button game-building";
        this.disabledStatus = this.prestigeDelayStatus;
        this.clearButtonContents();
        this.nameCell.innerHTML = "Building Prestige Unlocked";
      }
      this.countCell.innerHTML =
        "Ready in " + (Settings.building.prestigeWaitMillis - prestigeWaitTime);
    } else if (this.displayedStatus != this.readyToPrestigeStatus) {
      this.buttonDiv.className = "prestige-game-button game-building";
      this.displayedStatus = this.readyToPrestigeStatus;
      this.clearButtonContents();
      this.nameCell.innerHTML = name + " Prestige";
      this.countCell.innerHTML = "Bonus: 15% Tick Speed";
      this.costCell.innerHTML = "Count: " + building.getPrestigeCount();
    }
    if (this.progressSliderVisible) {
      Page.hideElement(this.progressSlider);
      this.progressSliderVisible = false;
    }
  } else {
    if (enabled) {
      if (this.displayedStatus != this.enabledStatus) {
        this.buttonDiv.className = "game-button game-building";
        this.displayedStatus = this.enabledStatus;
      }
      if (this.progressSliderVisible) {
        Page.hideElement(this.progressSlider);
        this.progressSliderVisible = false;
      }
    } else {
      if (this.displayedStatus != this.disabledStatus) {
        this.buttonDiv.className =
          "disabled-game-button transparent-button game-building";
        this.displayedStatus = this.disabledStatus;
      }
      if (Game.configuration.displayProgressSlider) {
        var progressFraction = Math.min(1, totalMoney / cost),
          progressWidth = Math.max(
            2,
            Cast.toInt(this.buttonWidth * progressFraction)
          );
        if (this.displayedProgress !== progressWidth) {
          this.displayedProgress = progressWidth;
          this.progressSlider.style.width = progressWidth + "px";
        }
      }
      if (
        !this.progressSliderVisible &&
        Game.configuration.displayProgressSlider
      ) {
        Page.showElement(this.progressSlider);
        this.progressSliderVisible = true;
      }
    }
    if (this.displayedName != name) {
      this.nameCell.innerHTML = name;
      this.displayedName = name;
    }
    if (
      this.displayedRate != rate ||
      this.displayedTickRate != Game.configuration.displayTickRate ||
      this.displayedRateFormat != Game.configuration.displayNumberFormat
    ) {
      if (Game.configuration.displayTickRate)
        this.rateCell.innerHTML =
          Formatter.formatNumber(rate, Game.configuration.displayNumberFormat) +
          "/tick";
      else
        this.rateCell.innerHTML =
          Formatter.formatNumber(rate, Game.configuration.displayNumberFormat) +
          "/s";
      this.displayedRate = rate;
      this.displayedTickRate = Game.configuration.displayTickRate;
      this.displayedRateFormat = Game.configuration.displayNumberFormat;
    }
    if (
      this.displayedCost != cost ||
      this.displayedCostFormat != Game.configuration.displayNumberFormat
    ) {
      this.costCell.innerHTML =
        "$" +
        Formatter.formatNumber(cost, Game.configuration.displayNumberFormat);
      this.displayedCost = cost;
      this.displayedCostFormat = Game.configuration.displayNumberFormat;
    }
    if (this.displayedCount != count) {
      this.countCell.innerHTML = Formatter.formatSmall(count);
      this.displayedCount = count;
    }
  }
  if (this.displayProgressSlider != Game.configuration.displayProgressSlider) {
    this.displayProgressSlider = Game.configuration.displayProgressSlider;
    if (!Game.configuration.displayProgressSlider) {
      Page.hideElement(this.progressSlider);
      this.progressSliderVisible = false;
    }
  }
};
BuildingView.prototype.clearButtonContents = function () {
  this.displayedName = null;
  this.displayedCost = -1;
  this.displayedRate = -1;
  this.displayedCount = -1;
  this.rateCell.innerHTML = "";
  this.costCell.innerHTML = "";
  this.countCell.innerHTML = "";
  this.nameCell.innerHTML = "";
};
BuildingView.prototype.handleButtonClick = function () {
  var building = Game.model.buildings[this.buildingIndex];
  if (building.isBuildingLocked()) return;
  if (building.isReadyToPrestige()) {
    var prestigeWaitTime =
        Time.getCurrentTime() - building.getPrestigeReadyTime(),
      waitingOnPrestige =
        prestigeWaitTime < Settings.building.prestigeWaitMillis;
    if (!waitingOnPrestige) building.prestigeBuilding();
  } else building.purchase();
};
function BuildingRowView(containerId, buildingIndex) {
  this.setContainerId(containerId);
  this.setViewVisible(true);
  this.buildingIndex = buildingIndex;
  this.addView(new BuildingView(this.getContainerId(), this.buildingIndex));
  var building = Game.model.buildings[this.buildingIndex],
    upgrades = building.getBuildingUpgrades();
  var i;
  for (i = 0; i < upgrades.length; i++)
    this.addView(
      new BuildingUpgradeView(this.getContainerId(), this.buildingIndex, i)
    );
}
BuildingRowView.prototype = new ParentView();
BuildingRowView.prototype.initializeView = function () {
  Page.clearChildren(this.getContainerId());
  this.invokeInitializeViewOnChildren();
};
function BuildingContainerView() {
  this.setContainerId("buildingContainer");
  this.setViewVisible(true);
}
BuildingContainerView.prototype = new VictoryAwareParentView();
BuildingContainerView.prototype.initializeView = function () {
  Page.clearChildren(this.getContainerId());
  this.clearChildViews();
  var parent = Page.getElement(this.getContainerId());
  var i, buildingRowDiv, buildingRowId;
  for (i = 0; i < Game.model.buildings.length; i++) {
    buildingRowId = "buildingRow" + i;
    buildingRowDiv = Page.createElement(
      "div",
      parent,
      buildingRowId,
      "button-row"
    );
    this.addView(new BuildingRowView(buildingRowId, i));
  }
  this.handleViewInitialization();
};
function ColumnStatusView(containerId, columnIndex) {
  this.setContainerId(containerId);
  this.setViewVisible(true);
  this.columnIndex = columnIndex;
  this.buttonDiv = null;
  this.displayedVisible = false;
  this.victoryColumn =
    columnIndex ===
    Game.model.columnStatusManager.getColumnStatusList().length - 1;
}
ColumnStatusView.prototype = new BaseView();
ColumnStatusView.prototype.initializeView = function () {
  var parent = Page.getElement(this.getContainerId());
  this.buttonDiv = Page.createElement(
    "div",
    parent,
    null,
    "unfilled-column-status game-upgrade"
  );
  this.displayedVisible = false;
  if (this.victoryColumn) {
    var thisRef = this;
    this.buttonDiv.onmouseup = function () {
      thisRef.handleVictoryButtonClick();
    };
  }
};
ColumnStatusView.prototype.updateViewContents = function () {
  var columnStatusList = Game.model.columnStatusManager.getColumnStatusList();
  if (this.columnIndex >= columnStatusList.length) return;
  var columnStatus = columnStatusList[this.columnIndex];
  if (columnStatus.isFilled()) {
    if (!this.displayedVisible) {
      if (this.victoryColumn) {
        this.buttonDiv.className = "victory-column-status game-upgrade";
        this.buttonDiv.innerHTML = "Win";
      } else {
        this.buttonDiv.className = "filled-column-status game-upgrade";
        this.buttonDiv.innerHTML =
          Formatter.formatSmall(columnStatus.getColumnStatusBonusPercent()) +
          "%";
        this.buttonDiv.title =
          "Full column bonus. Only active when full column is unlocked.";
      }
      this.displayedVisible = true;
    }
  } else if (this.displayedVisible) {
    this.buttonDiv.className = "unfilled-column-status game-upgrade";
    this.buttonDiv.innerHTML = "";
    this.displayedVisible = false;
  }
};
ColumnStatusView.prototype.handleVictoryButtonClick = function () {
  if (!this.victoryColumn) return;
  var columnStatusList = Game.model.columnStatusManager.getColumnStatusList(),
    columnStatus = columnStatusList[this.columnIndex];
  if (!columnStatus.isFilled()) return;
  Game.gameLogic.onGameCompletion();
};
function ColumnStatusRowView() {
  this.setContainerId("columnStatusContainer");
  this.setViewVisible(true);
  var i,
    columnStatusList = Game.model.columnStatusManager.getColumnStatusList();
  for (i = 0; i < columnStatusList.length; i++)
    this.addView(new ColumnStatusView(this.getContainerId(), i));
}
ColumnStatusRowView.prototype = new VictoryAwareParentView();
ColumnStatusRowView.prototype.initializeView = function () {
  Page.clearChildren(this.getContainerId());
  var parent = Page.getElement(this.getContainerId());
  var containerDiv = Page.createElement(
    "div",
    parent,
    null,
    "game-building-container"
  );
  Page.createElement(
    "div",
    containerDiv,
    null,
    "game-building unfilled-column-status"
  );
  this.handleViewInitialization();
};
function ElapsedTimeView() {
  this.setContainerId("statusBarContainer");
  this.setViewVisible(true);
  this.elapsedTimeDiv = null;
  this.displayedTime = -1;
  this.displayedFormattedString = "";
}
ElapsedTimeView.prototype = new BaseView();
ElapsedTimeView.prototype.initializeView = function () {
  this.elapsedTimeDiv = Page.getElement("elapsedTime");
  this.displayedTime = -1;
  this.displayedFormattedString = "";
};
ElapsedTimeView.prototype.updateViewContents = function () {
  var time = Time.getCurrentTime() - Game.model.total.getGameStartTime();
  if (this.displayedTime != time) {
    this.displayedTime = time;
    var formattedTime = Formatter.formatElapsedTime(time);
    if (this.displayedFormattedString != formattedTime) {
      this.displayedFormattedString = formattedTime;
      this.elapsedTimeDiv.innerHTML = formattedTime;
    }
  }
};
function PercentCompleteView() {
  this.setContainerId("statusBarContainer");
  this.setViewVisible(true);
  this.percentCompleteDiv = null;
  this.displayedUpgradeCount = -1;
}
PercentCompleteView.prototype = new BaseView();
PercentCompleteView.prototype.initializeView = function () {
  this.percentCompleteDiv = Page.getElement("percentComplete");
  this.displayedUpgradeCount = -1;
};
PercentCompleteView.prototype.updateViewContents = function () {
  var purchasedUpgradeCount = Game.model.total.getPurchasedUpgradeCount();
  if (this.displayedUpgradeCount != purchasedUpgradeCount) {
    this.displayedUpgradeCount = purchasedUpgradeCount;
    var totalUpgrades =
        Game.model.buildings.length * Settings.building.numBuildingUpgrades,
      percentComplete = (100 * purchasedUpgradeCount) / totalUpgrades;
    this.percentCompleteDiv.innerHTML =
      percentComplete.toFixed(1) + "% complete";
  }
};
function GameVictoriesView() {
  this.setContainerId("statusBarContainer");
  this.setViewVisible(true);
  this.gameVictoriesDiv = null;
  this.displayedVictoryCount = -1;
}
GameVictoriesView.prototype = new BaseView();
GameVictoriesView.prototype.initializeView = function () {
  this.gameVictoriesDiv = Page.getElement("gameVictories");
  this.displayedVictoryCount = -1;
};
GameVictoriesView.prototype.updateViewContents = function () {
  var victoryCount = Game.model.total.getVictoryCount();
  if (this.displayedVictoryCount != victoryCount) {
    this.displayedVictoryCount = victoryCount;
    this.gameVictoriesDiv.innerHTML = "victories: " + victoryCount;
  }
};
function TickRateToggleView() {
  this.setContainerId("statusBarContainer");
  this.setViewVisible(true);
  this.tickRateToggleLink = null;
  this.displayedPerTick = true;
}
TickRateToggleView.prototype = new BaseView();
TickRateToggleView.prototype.initializeView = function () {
  this.tickRateToggleLink = Page.getElement("tickRateToggleButton");
  this.tickRateToggleLink.innerHTML = "rate: value/tick";
  this.displayedPerTick = !Game.configuration.displayTickRate;
  this.tickRateToggleLink.onclick = function () {
    Game.configuration.displayTickRate = !Game.configuration.displayTickRate;
    return false;
  };
};
TickRateToggleView.prototype.updateViewContents = function () {
  if (this.displayedPerTick != Game.configuration.displayTickRate) {
    this.displayedPerTick = Game.configuration.displayTickRate;
    if (Game.configuration.displayTickRate)
      this.tickRateToggleLink.innerHTML = "rate: value/tick";
    else this.tickRateToggleLink.innerHTML = "rate: value/sec";
  }
};
function NumberFormattingToggleView() {
  this.setContainerId("statusBarContainer");
  this.setViewVisible(true);
  this.toggleLink = null;
  this.displayedFormat = FormatType.LONG_FORMAT;
}
NumberFormattingToggleView.prototype = new BaseView();
NumberFormattingToggleView.prototype.initializeView = function () {
  this.toggleLink = Page.getElement("formattingToggleButton");
  this.toggleLink.innerHTML = "numbers: long format";
  this.displayedFormat = FormatType.LONG_FORMAT;
  this.toggleLink.onclick = function () {
    switch (Game.configuration.displayNumberFormat) {
      case FormatType.LONG_FORMAT:
        Game.configuration.displayNumberFormat = FormatType.SHORT_FORMAT;
        break;
      case FormatType.SHORT_FORMAT:
        Game.configuration.displayNumberFormat = FormatType.SCIENTIFIC_NOTATION;
        break;
      case FormatType.SCIENTIFIC_NOTATION:
      default:
        Game.configuration.displayNumberFormat = FormatType.LONG_FORMAT;
        break;
    }
    return false;
  };
};
NumberFormattingToggleView.prototype.updateViewContents = function () {
  if (this.displayedFormat != Game.configuration.displayNumberFormat) {
    this.displayedFormat = Game.configuration.displayNumberFormat;
    if (Game.configuration.displayNumberFormat === FormatType.LONG_FORMAT)
      this.toggleLink.innerHTML = "numbers: long format";
    else if (Game.configuration.displayNumberFormat === FormatType.SHORT_FORMAT)
      this.toggleLink.innerHTML = "numbers: short format";
    else if (
      Game.configuration.displayNumberFormat === FormatType.SCIENTIFIC_NOTATION
    )
      this.toggleLink.innerHTML = "numbers: scientific";
    else this.toggleLink.innerHTML = "numbers: error";
  }
};
function AutoPlayToggleView() {
  this.setContainerId("statusBarContainer");
  this.setViewVisible(true);
  this.autoPlayToggleLink = null;
  this.displayedAutoPlayEnabled = false;
}
AutoPlayToggleView.prototype = new BaseView();
AutoPlayToggleView.prototype.initializeView = function () {
  this.autoPlayToggleLink = Page.getElement("autoPlayToggleButton");
  this.autoPlayToggleLink.innerHTML = "auto play: disabled";
  this.displayedAutoPlayEnabled = !Game.configuration.autoPlayMode;
  this.autoPlayToggleLink.onclick = function () {
    Game.configuration.autoPlayMode = !Game.configuration.autoPlayMode;
    return false;
  };
};
AutoPlayToggleView.prototype.updateViewContents = function () {
  if (this.displayedAutoPlayEnabled != Game.configuration.autoPlayMode) {
    this.displayedAutoPlayEnabled = Game.configuration.autoPlayMode;
    if (Game.configuration.autoPlayMode)
      this.autoPlayToggleLink.innerHTML = "auto play: enabled";
    else this.autoPlayToggleLink.innerHTML = "auto play: disabled";
  }
};
function ProgressSliderToggleView() {
  this.setContainerId("statusBarContainer");
  this.setViewVisible(true);
  this.progressSliderToggleLink = null;
  this.displayedProgressSliderEnabled = false;
}
ProgressSliderToggleView.prototype = new BaseView();
ProgressSliderToggleView.prototype.initializeView = function () {
  this.progressSliderToggleLink = Page.getElement("progressSliderToggleButton");
  this.progressSliderToggleLink.innerHTML = "progress slider: enabled";
  this.displayedProgressSliderEnabled =
    !Game.configuration.displayProgressSlider;
  this.progressSliderToggleLink.onclick = function () {
    Game.configuration.displayProgressSlider =
      !Game.configuration.displayProgressSlider;
    return false;
  };
};
ProgressSliderToggleView.prototype.updateViewContents = function () {
  if (
    this.displayedProgressSliderEnabled !=
    Game.configuration.displayProgressSlider
  ) {
    this.displayedProgressSliderEnabled =
      Game.configuration.displayProgressSlider;
    if (Game.configuration.displayProgressSlider)
      this.progressSliderToggleLink.innerHTML = "progress slider: enabled";
    else this.progressSliderToggleLink.innerHTML = "progress slider: disabled";
  }
};
function ResetGameView() {
  this.setContainerId("statusBarContainer");
  this.setViewVisible(true);
  this.resetGameLink = null;
  this.confirmYesLink = null;
  this.confirmNoLink = null;
  this.confirmationVisible = false;
  this.displayedConfirmation = false;
}
ResetGameView.prototype = new BaseView();
ResetGameView.prototype.initializeView = function () {
  this.resetGameLink = Page.getElement("resetGameButton");
  this.confirmYesLink = Page.getElement("resetConfirmButtonYes");
  this.confirmNoLink = Page.getElement("resetConfirmButtonNo");
  this.confirmationVisible = false;
  var thisRef = this;
  this.resetGameLink.onclick = function () {
    thisRef.confirmationVisible = true;
    return false;
  };
  this.confirmYesLink.onclick = function () {
    if (thisRef.confirmationVisible) {
      thisRef.confirmationVisible = false;
      Game.onResetGameButtonPress();
    }
    return false;
  };
  this.confirmNoLink.onclick = function () {
    thisRef.confirmationVisible = false;
    return false;
  };
};
ResetGameView.prototype.updateViewContents = function () {
  if (this.displayedConfirmation != this.confirmationVisible) {
    this.displayedConfirmation = this.confirmationVisible;
    if (this.confirmationVisible) {
      this.resetGameLink.style.display = "none";
      Page.showElementId("resetConfirmation");
    } else {
      this.resetGameLink.style.display = "inline";
      Page.hideElementId("resetConfirmation");
    }
  }
};
function StatusBarView() {
  this.setContainerId("statusBarContainer");
  this.setViewVisible(true);
  this.addView(new ElapsedTimeView());
  this.addView(new PercentCompleteView());
  this.addView(new GameVictoriesView());
  this.addView(new TickRateToggleView());
  this.addView(new NumberFormattingToggleView());
  this.addView(new ProgressSliderToggleView());
  this.addView(new AutoPlayToggleView());
}
StatusBarView.prototype = new VictoryAwareParentView();
StatusBarView.prototype.initializeView = function () {
  this.handleViewInitialization();
};
function SaveButtonView() {
  this.setContainerId("saveContainer");
  this.setViewVisible(true);
  this.saveButton = null;
}
SaveButtonView.prototype = new BaseView();
SaveButtonView.prototype.initializeView = function () {
  this.saveButton = Page.getElement("saveButton");
  this.saveButton.onclick = function () {
    Game.saveManager.saveGame();
    return false;
  };
};
function LastSaveTimeView() {
  this.setContainerId("saveContainer");
  this.setViewVisible(true);
  this.saveTimeDiv = null;
  this.saveDate = new Date();
  this.displayedSaveTime = -1;
}
LastSaveTimeView.prototype = new BaseView();
LastSaveTimeView.prototype.initializeView = function () {
  this.saveTimeDiv = Page.getElement("lastSaveTime");
  this.displayedSaveTime = -1;
};
LastSaveTimeView.prototype.updateViewContents = function () {
  var saveTime = Game.saveManager.getLastSaveTime();
  if (this.displayedSaveTime != saveTime) {
    this.displayedSaveTime = saveTime;
    this.saveDate.setTime(this.displayedSaveTime);
    this.saveTimeDiv.innerHTML =
      "saved at " + this.saveDate.toLocaleTimeString();
  }
};
function ExportSaveView() {
  this.setContainerId("saveContainer");
  this.setViewVisible(true);
  this.exportLink = null;
  this.doneLink = null;
  this.exportFieldVisible = false;
  this.displayedExportData = false;
  this.exportSaveInput = null;
}
ExportSaveView.prototype = new BaseView();
ExportSaveView.prototype.initializeView = function () {
  this.exportLink = Page.getElement("exportSave");
  this.doneLink = Page.getElement("exportDoneButton");
  this.exportSaveInput = Page.getElement("exportSaveInput");
  var thisRef = this;
  this.exportLink.onclick = function () {
    thisRef.exportFieldVisible = true;
    thisRef.exportSaveInput.value = Game.saveManager.getSaveState();
    return false;
  };
  this.doneLink.onclick = function () {
    thisRef.exportFieldVisible = false;
    thisRef.exportSaveInput.value = "";
    return false;
  };
};
ExportSaveView.prototype.updateViewContents = function () {
  if (this.displayedExportData != this.exportFieldVisible) {
    this.displayedExportData = this.exportFieldVisible;
    if (this.exportFieldVisible) {
      this.exportLink.style.display = "none";
      Page.showElementId("exportSaveContainer");
      this.exportSaveInput.select();
    } else {
      this.exportLink.style.display = "inline";
      Page.hideElementId("exportSaveContainer");
    }
  }
};
function ImportSaveView() {
  this.setContainerId("saveContainer");
  this.setViewVisible(true);
  this.importOpenButton = null;
  this.importActivateButton = null;
  this.importCancelButton = null;
  this.errorMessageDoneButton = null;
  this.importSaveError = false;
  this.importSaveInput = null;
}
ImportSaveView.prototype = new BaseView();
ImportSaveView.prototype.initializeView = function () {
  this.importOpenButton = Page.getElement("importSave");
  this.importActivateButton = Page.getElement("importActivateButton");
  this.importCancelButton = Page.getElement("importCancelButton");
  this.errorMessageDoneButton = Page.getElement("errorMessageDoneButton");
  this.importSaveInput = Page.getElement("importSaveInput");
  var thisRef = this;
  this.importOpenButton.onclick = function () {
    thisRef.importOpenButton.style.display = "none";
    Page.showElementId("importSaveContainer");
    thisRef.importSaveInput.value = "";
    thisRef.importSaveInput.focus();
    thisRef.importSaveError = false;
    return false;
  };
  this.importActivateButton.onclick = function () {
    thisRef.importSaveError = !Game.onImportOkButtonPress(
      thisRef.importSaveInput.value
    );
    thisRef.importSaveInput.value = "";
    if (thisRef.importSaveError) Page.showElementId("importSaveError");
    else thisRef.importOpenButton.style.display = "inline";
    Page.hideElementId("importSaveContainer");
    return false;
  };
  this.importCancelButton.onclick = function () {
    thisRef.importOpenButton.style.display = "inline";
    Page.hideElementId("importSaveContainer");
    thisRef.importSaveInput.value = "";
    return false;
  };
  this.errorMessageDoneButton.onclick = function () {
    thisRef.importOpenButton.style.display = "inline";
    Page.hideElementId("importSaveError");
    return false;
  };
};
function DeleteGameView() {
  this.setContainerId("saveContainer");
  this.setViewVisible(true);
  this.deleteGameLink = null;
  this.confirmYesLink = null;
  this.confirmNoLink = null;
  this.confirmationVisible = false;
  this.displayedConfirmation = false;
}
DeleteGameView.prototype = new BaseView();
DeleteGameView.prototype.initializeView = function () {
  this.deleteGameLink = Page.getElement("deleteGameButton");
  this.confirmYesLink = Page.getElement("deleteConfirmButtonYes");
  this.confirmNoLink = Page.getElement("deleteConfirmButtonNo");
  this.confirmationVisible = false;
  var thisRef = this;
  this.deleteGameLink.onclick = function () {
    thisRef.confirmationVisible = true;
    return false;
  };
  this.confirmYesLink.onclick = function () {
    if (thisRef.confirmationVisible) {
      thisRef.confirmationVisible = false;
      Game.onDeleteGameButtonPress();
    }
    return false;
  };
  this.confirmNoLink.onclick = function () {
    thisRef.confirmationVisible = false;
    return false;
  };
};
DeleteGameView.prototype.updateViewContents = function () {
  if (this.displayedConfirmation != this.confirmationVisible) {
    this.displayedConfirmation = this.confirmationVisible;
    if (this.confirmationVisible) {
      this.deleteGameLink.style.display = "none";
      Page.showElementId("deleteConfirmation");
    } else {
      this.deleteGameLink.style.display = "inline";
      Page.hideElementId("deleteConfirmation");
    }
  }
};
function SaveRowView() {
  this.setContainerId("saveContainer");
  this.setViewVisible(true);
  this.addView(new SaveButtonView());
  this.addView(new LastSaveTimeView());
  this.addView(new ResetGameView());
  this.addView(new ExportSaveView());
  this.addView(new ImportSaveView());
  this.addView(new DeleteGameView());
}
SaveRowView.prototype = new VictoryAwareParentView();
SaveRowView.prototype.initializeView = function () {
  this.handleViewInitialization();
};
function VictoryView() {
  this.setContainerId("victoryContainer");
  this.displayedVictory = false;
}
VictoryView.prototype = new BaseView();
VictoryView.prototype.initializeView = function () {
  Page.clearChildren(this.getContainerId());
  this.displayedVictory = false;
};
VictoryView.prototype.isViewVisible = function () {
  return Game.gameWon;
};
VictoryView.prototype.updateViewContents = function () {
  var victory = Game.gameWon;
  if (this.displayedVictory != victory) {
    if (victory) this.createVictoryScreen();
    else Page.clearChildren(this.getContainerId());
    this.displayedVictory = victory;
  }
};
VictoryView.prototype.createVictoryScreen = function () {
  var parent = Page.getElement(this.getContainerId());
  var victoryTitleDiv = Page.createElement(
    "div",
    parent,
    null,
    "victory-title"
  );
  victoryTitleDiv.innerHTML = "VICTORY!";
  var victoryComments = Page.createElement(
    "div",
    parent,
    null,
    "victory-comments"
  );
  victoryComments.innerHTML =
    "You have managed to make all those little boxes turn green.";
  var timeDisplay = Page.createElement("div", parent, null, "victory-comments");
  timeDisplay.innerHTML =
    "Time: " +
    Formatter.formatElapsedTime(
      Game.model.total.getGameEndTime() - Game.model.total.getGameStartTime()
    );
  var restartButton = Page.createElement(
    "div",
    parent,
    null,
    "game-button restart-button"
  );
  restartButton.innerHTML = "Restart";
  restartButton.onmouseup = function () {
    Game.onResetGameButtonPress();
  };
  var restartComments = Page.createElement(
    "div",
    parent,
    null,
    "victory-comments"
  );
  restartComments.innerHTML =
    "Restarting will add one row to the grid and provide a tick rate bonus.";
};
function GameView() {
  this.setContainerId("gameContainer");
  this.setViewVisible(true);
}
GameView.prototype = new ParentView();
GameView.prototype.createChildren = function () {
  this.clearChildViews();
  this.addView(new HeaderRowView());
  this.addView(new BuildingContainerView());
  this.addView(new ColumnStatusRowView());
  this.addView(new StatusBarView());
  this.addView(new SaveRowView());
  this.addView(new VictoryView());
};
GameView.prototype.onGameReset = function () {
  this.invokeInitializeViewOnChildren();
};
GameView.prototype.updateViewContents = function () {
  this.updateChildViews();
};
function SaveManager() {
  this.saveKey = "BASIC_v1.00";
  this.lastSaveTime = Time.getCurrentTime();
  this.autoSavePeriod = 1e3 * 60 * 5;
}
SaveManager.prototype.deleteSave = function () {
  if (typeof localStorage != "undefined") localStorage.removeItem(this.saveKey);
  this.lastSaveTime = Time.getCurrentTime();
  EventTracker.trackEvent("BASIC SaveManager", "Delete");
};
SaveManager.prototype.checkForAutoSave = function () {
  if (Time.getCurrentTime() - this.lastSaveTime > this.autoSavePeriod) {
    this.saveGame();
    EventTracker.trackEvent("BASIC SaveManager", "Save");
  }
};
SaveManager.prototype.getLastSaveTime = function () {
  return this.lastSaveTime;
};
SaveManager.prototype.saveGame = function () {
  var saveState = this.getSaveState();
  if (saveState) {
    if (typeof localStorage != "undefined")
      localStorage.setItem(this.saveKey, saveState);
    this.lastSaveTime = Time.getCurrentTime();
  }
};
SaveManager.prototype.loadSave = function () {
  if (typeof localStorage != "undefined")
    this.importSaveInternal(localStorage.getItem(this.saveKey));
  EventTracker.trackEvent("BASIC SaveManager", "Load");
};
SaveManager.prototype.importSave = function (compressedSaveState) {
  EventTracker.trackEvent("BASIC SaveManager", "Import");
  return this.importSaveInternal(compressedSaveState);
};
SaveManager.prototype.importSaveInternal = function (compressedSaveState) {
  if (compressedSaveState) {
    var jsonString = LZString.decompressFromBase64(compressedSaveState);
    if (jsonString) {
      var saveState = JSON.parse(jsonString);
      if (saveState) {
        Game.resetGameModels();
        if (this.loadSaveState(saveState)) Game.loadState();
        return true;
      }
    }
  }
  return false;
};
SaveManager.prototype.getSaveState = function () {
  var jsonString = JSON.stringify(this.generateSaveState());
  if (jsonString) return LZString.compressToBase64(jsonString);
  else return null;
};
SaveManager.prototype.generateSaveState = function () {
  if (!Game.gameInitialized)
    return { saveKey: this.saveKey, gameInitialized: false, gameWon: false };
  return {
    saveKey: this.saveKey,
    gameInitialized: Game.gameInitialized,
    gameWon: Game.gameWon,
    purchaseCount: Game.model.purchaseCount.getCount(),
    tick: this.generateTickState(),
    total: this.generateTotalState(),
    buildings: this.generateBuildingsState(),
    configuration: this.generateConfigurationState(),
  };
};
SaveManager.prototype.loadSaveState = function (saveState) {
  Game.gameInitialized = saveState["gameInitialized"];
  if (!Game.gameInitialized) {
    Game.initializeState();
    return true;
  }
  Game.gameWon = saveState["gameWon"];
  var purchaseCount = saveState["purchaseCount"];
  Game.model.purchaseCount.setCount(
    purchaseCount ? purchaseCount : Game.model.purchaseCount.getCount()
  );
  this.loadTickState(saveState["tick"]);
  this.loadTotalState(saveState["total"]);
  this.loadBuildingsState(saveState["buildings"]);
  this.loadConfigurationState(saveState["configuration"]);
  return true;
};
SaveManager.prototype.generateConfigurationState = function () {
  return {
    displayTickRate: Game.configuration.displayTickRate,
    displayNumberFormat: Game.configuration.displayNumberFormat,
    displayProgressSlider: Game.configuration.displayProgressSlider,
    autoPlayMode: Game.configuration.autoPlayMode,
  };
};
SaveManager.prototype.loadConfigurationState = function (configurationState) {
  if (!configurationState) return;
  var displayTickRate = configurationState["displayTickRate"],
    displayNumberFormat = configurationState["displayNumberFormat"],
    displayProgressSlider = configurationState["displayProgressSlider"],
    autoPlayMode = configurationState["autoPlayMode"];
  if (displayProgressSlider == "undefined") displayProgressSlider = true;
  Game.configuration.displayTickRate = displayTickRate ? true : false;
  Game.configuration.displayNumberFormat = displayNumberFormat
    ? displayNumberFormat
    : FormatType.LONG_FORMAT;
  Game.configuration.displayProgressSlider = displayProgressSlider
    ? true
    : false;
  Game.configuration.autoPlayMode = autoPlayMode ? true : false;
};
SaveManager.prototype.generateTickState = function () {
  return {
    buildingPrestigeCount: Game.model.tick.getBuildingPrestigeCount(),
    lastTickTime: Game.model.tick.getLastTickTime(),
  };
};
SaveManager.prototype.loadTickState = function (tickState) {
  if (!tickState) {
    console.log("ERROR: No tick state in save file.");
    return;
  }
  var buildingPrestigeCount = tickState["buildingPrestigeCount"],
    lastTickTime = tickState["lastTickTime"];
  Game.model.tick.setBuildingPrestigeCount(
    buildingPrestigeCount
      ? buildingPrestigeCount
      : Game.model.tick.getBuildingPrestigeCount()
  );
  Game.model.tick.setLastTickTime(
    lastTickTime ? lastTickTime : Game.model.tick.getLastTickTime()
  );
};
SaveManager.prototype.generateTotalState = function () {
  var total = Game.model.total;
  return {
    value: total.getValue(),
    rateMultiplier: total.getRateMultiplier(),
    victoryCount: total.getVictoryCount(),
    gameStartTime: total.getGameStartTime(),
    gameEndTime: total.getGameEndTime(),
  };
};
SaveManager.prototype.loadTotalState = function (totalState) {
  if (!totalState) {
    console.log("ERROR: No total state in save file.");
    return;
  }
  var value = totalState["value"],
    rateMultiplier = totalState["rateMultiplier"],
    victoryCount = totalState["victoryCount"],
    gameStartTime = totalState["gameStartTime"],
    gameEndTime = totalState["gameEndTime"];
  var total = Game.model.total;
  total.setValue(value ? value : total.getValue());
  total.setRateMultiplier(
    rateMultiplier ? rateMultiplier : total.getRateMultiplier()
  );
  total.setVictoryCount(victoryCount ? victoryCount : total.getVictoryCount());
  total.setGameStartTime(
    gameStartTime ? gameStartTime : total.getGameStartTime()
  );
  total.setGameEndTime(gameEndTime);
};
SaveManager.prototype.generateBuildingsState = function () {
  var buildingsState = [],
    i;
  for (i = 0; i < Game.model.buildings.length; i++)
    buildingsState.push(this.generateBuildingState(Game.model.buildings[i]));
  return buildingsState;
};
SaveManager.prototype.loadBuildingsState = function (buildingStates) {
  if (!buildingStates || buildingStates.length === 0) {
    console.log("ERROR: No buildings found in save file.");
    return;
  }
  Game.model.buildings = [];
  var i;
  for (i = 0; i < buildingStates.length; i++)
    Game.model.buildings.push(this.loadBuildingState(buildingStates[i]));
};
SaveManager.prototype.generateBuildingState = function (building) {
  return {
    buildingIndex: building.getBuildingIndex(),
    name: building.getName(),
    count: building.getCount(),
    buildingLocked: building.isBuildingLocked(),
    readyToPrestige: building.isReadyToPrestige(),
    prestigeCount: building.getPrestigeCount(),
    upgrades: this.generateUpgradesState(building.getBuildingUpgrades()),
  };
};
SaveManager.prototype.loadBuildingState = function (buildingState) {
  var buildingIndex = buildingState["buildingIndex"],
    name = buildingState["name"],
    count = buildingState["count"],
    buildingLocked = buildingState["buildingLocked"],
    readyToPrestige = buildingState["readyToPrestige"],
    prestigeCount = buildingState["prestigeCount"];
  var building = Game.buildingGenerator.generateBuilding(
    buildingIndex,
    prestigeCount
  );
  building.setName(name);
  building.setCount(count);
  building.setBuildingLocked(buildingLocked);
  building.setReadyToPrestige(readyToPrestige);
  building.setPrestigeCount(prestigeCount);
  this.loadUpgradesState(
    building.getBuildingUpgrades(),
    buildingState["upgrades"]
  );
  building.calculateUpgradesPurchased();
  return building;
};
SaveManager.prototype.generateUpgradesState = function (upgrades) {
  var upgradesState = [],
    i;
  for (i = 0; i < upgrades.length; i++)
    upgradesState.push(this.generateUpgradeState(upgrades[i]));
  return upgradesState;
};
SaveManager.prototype.loadUpgradesState = function (upgrades, upgradeStates) {
  if (!upgradeStates) return;
  var i;
  for (i = 0; i < upgrades.length; i++) {
    if (i >= upgradeStates.length) break;
    this.loadUpgrade(upgrades[i], upgradeStates[i]);
  }
};
SaveManager.prototype.generateUpgradeState = function (upgrade) {
  return { purchased: upgrade.isPurchased(), locked: upgrade.isLocked() };
};
SaveManager.prototype.loadUpgrade = function (upgrade, upgradeState) {
  var purchased = upgradeState["purchased"],
    locked = upgradeState["locked"];
  upgrade.setPurchased(purchased);
  upgrade.setLocked(locked);
};
function GameLogic() {}
GameLogic.prototype.onGameCompletion = function () {
  Game.gameWon = true;
  Game.model.total.onGameVictory();
  Game.saveManager.saveGame();
  EventTracker.trackEvent("BASIC Victory", "Game Over");
};
GameLogic.prototype.processGameLogic = function () {
  var ticks = Game.model.tick.getElapsedTicks();
  Game.model.total.updateForFrame(ticks);
  if (Game.configuration.autoPlayMode) Game.model.autoPlay.playTurn();
};
function GameLoop() {
  this.prevFrameTimeStamp = Time.getCurrentTime();
  window.requestAnimFrame = (function () {
    return (
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (callback) {
        window.setTimeout(callback, 1e3 / 60);
      }
    );
  })();
  var selfReference = this;
  this.gameLoopReference = function () {
    selfReference.gameLoop();
  };
}
GameLoop.prototype.gameLoop = function () {
  if (!Game.gameInitialized) {
    Game.initializeState();
    Game.saveManager.loadSave();
    this.prevFrameTimeStamp = Time.getCurrentTime();
    Game.gameView.createChildren();
    Game.gameView.initializeView();
  } else {
    var deltaTime = Math.max(
      0,
      Time.getCurrentTime() - this.prevFrameTimeStamp
    );
    if (!Game.gameWon && deltaTime > 0)
      Game.gameLogic.processGameLogic(deltaTime);
    if (Game.gameVisible) Game.gameView.updateView();
    Game.saveManager.checkForAutoSave();
    this.prevFrameTimeStamp = Time.getCurrentTime();
  }
  window.requestAnimFrame(this.gameLoopReference);
};
var Game = {
  gameLogic: new GameLogic(),
  gameLoop: new GameLoop(),
  gameView: new GameView(),
  saveManager: new SaveManager(),
  buildingGenerator: new BuildingGenerator(),
  gameInitialized: false,
  gameWon: false,
  gameVisible: true,
  configuration: {
    displayTickRate: true,
    displayNumberFormat: FormatType.LONG_FORMAT,
    displayProgressSlider: true,
    autoPlayMode: false,
  },
  model: {
    purchaseCount: new PurchaseCount(),
    buildings: [],
    tick: new Tick(),
    total: new Total(),
    columnStatusManager: new ColumnStatusManager(),
    autoPlay: new AutoPlay(),
  },
  onVisibilityChange: function () {
    if (typeof document.hidden !== "undefined")
      Game.gameVisible = !document.hidden;
  },
  setupVisibilityListener: function () {
    var onVisibilityChange = Game.onVisibilityChange;
    document.addEventListener("visibilitychange", onVisibilityChange, false);
  },
  onLoad: function () {
    Game.setupVisibilityListener();
    Game.gameLoop.gameLoop();
  },
  resetGameModels: function () {
    Game.gameWon = false;
    Game.model.purchaseCount.resetPurchaseCount();
    Game.model.total.resetTotalState();
    Game.model.tick.resetTickState();
    Game.model.columnStatusManager.resetColumnStatusManager();
    Game.model.autoPlay.resetAutoPlayState();
    var i;
    for (i = 0; i < Game.model.buildings.length; i++)
      Game.model.buildings[i].resetBuildingState();
  },
  initializeState: function () {
    Game.gameInitialized = true;
    Game.model.buildings = Game.buildingGenerator.generateInitialBuildings();
    Game.resetGameModels();
  },
  loadState: function () {
    Game.model.total.onSaveLoad();
    Game.model.tick.onSaveLoad();
    Game.model.columnStatusManager.onSaveLoad();
  },
  onImportOkButtonPress: function (saveState) {
    var currentState = Game.saveManager.getSaveState();
    if (Game.saveManager.importSave(saveState)) {
      Game.loadState();
      Game.gameView.onGameReset();
      return true;
    } else {
      Game.saveManager.importSave(currentState);
      return false;
    }
  },
  onResetGameButtonPress: function () {
    Game.initializeState();
    Game.saveManager.deleteSave();
    Game.saveManager.saveGame();
    Game.loadState();
    Game.gameView.onGameReset();
  },
  onDeleteGameButtonPress: function () {
    Game.model.total = new Total();
    Game.onResetGameButtonPress();
  },
};
window["Game"] = Game;
