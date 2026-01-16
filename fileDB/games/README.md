# 游戏数据结构说明

## games.json - 游戏列表
存储所有可用游戏的基本信息
```json
[
  {
    "id": "game2048",
    "name": "2048",
    "cover": "/uploadFiles/gameFiles/2048/cover.png",
    "description": "经典数字合成游戏",
    "enabled": true,
    "createTime": "2026-01-16T00:00:00.000Z"
  }
]
```

## gameStats.json - 游戏统计数据
存储每个游戏的统计信息
```json
{
  "game2048": {
    "gameCount": 0,              // 游戏次数
    "totalPlayTime": 0,          // 累计游戏时间（秒）
    "todayPlayTime": 0,          // 今日游戏时间（秒）
    "highestScore": 0,           // 历史最高分
    "todayHighestScore": 0,      // 今日最高分
    "lastPlayDate": "",          // 最后游戏日期
    "todayDate": ""              // 今日日期（用于重置今日数据）
  }
}
```

## gameSaves.json - 游戏存档
存储游戏的存档数据
```json
{
  "game2048": {
    "saveTime": "2026-01-16T12:00:00.000Z",
    "gameData": {
      // 具体游戏的存档数据
    }
  }
}
```
