// 《收租万倍返还》MVU 变量结构定义（Zod 4 · v4 结构对齐重生卡骨架）
// 运行时已注入全局 z（Zod 4）与 _（lodash），此处禁止任何 import
// 约定：数字一律 z.coerce.number()；范围用 _.clamp 收敛；动态集合用 z.record + .prefault({})

export const Schema = z.object({
  // ── 世界：时间、地点与章节锁节点 ──
  世界: z
    .object({
      日期: z.coerce.number().prefault(1), // 第N天；事件调度器用它比对节点表，第N天=第N章
      时段: z
        .enum(['清晨', '上午', '中午', '下午', '傍晚', '晚上', '深夜'])
        .prefault('下午'),
      当前地点: z.string().prefault('江城｜餐厅包间'), // 格式「区域｜场景」
      天气: z.string().prefault('八月底，闷热'),
      剧情节点: z
        .object({
          当前事件: z.string().prefault('无'), // 调度器唯一写入，值=节点表事件名
          当前节点: z.string().prefault('无'), // 切换事件时调度器重置为首节点，此后由模型推进
          下一个事件: z.string().prefault(''), // 调度器唯一写入
        })
        .prefault({}),
    })
    .prefault({}),

  // ── 主角：登记档案、系统成长与资产 ──
  主角: z
    .object({
      基本信息: z
        .object({
          姓名: z.string().prefault('林野'), // 默认林野模板，开局登记可被玩家自定义覆写
          年龄: z.coerce.number().prefault(30),
          性别: z.string().prefault('男'),
          身高: z.string().prefault('一米八二'),
          体型: z.string().prefault('久坐微堕，尚未被系统改造'),
          外貌: z.string().prefault('三十岁，大厂十年项目负责人，气质偏沉'),
          衣着: z.string().prefault('灰色T恤配黑色休闲裤'),
        })
        .prefault({}),
      已登记: z.boolean().prefault(false), // 开局【接手登记】完成当轮置 true；此后只读
      身份: z
        .object({
          社会身份: z.string().prefault('翡翠湾叠墅房东'), // 玩家自定义身份时按登记信息改写
          职业: z.string().prefault('无业（前大厂项目负责人，拿补偿金买房收租）'),
        })
        .prefault({}),
      系统: z
        .object({
          返现倍数: z.coerce.number().prefault(10000), // 固定万倍
          神豪等级: z
            .enum(['萌新房东', '包租新人', '职业房东', '地产新贵', '收租大亨', '神豪'])
            .prefault('萌新房东'), // 随累计返利跨升级线更新
          累计返利: z.coerce.number().prefault(0), // 只增不减，系统返还现金累加
          被动技能: z
            .array(
              z.enum(['黄金瞳', '商业洞察之眼', '黑客精通', '读心术限定版', '龙精虎猛', '百毒不侵']),
            )
            .prefault([]), // 开局为空，按原著结算解锁
          技能次数: z
            .record(
              z.string().describe('主动技能名'),
              z.coerce.number().transform((value) => _.clamp(value, 0, 3)),
            )
            .prefault({}), // 读心术/黄金瞳/商业洞察之眼当日次数，上限3
        })
        .prefault({}),
      资产: z
        .object({
          现金: z.coerce.number().prefault(500000), // 开局约50万，可为负触发危机
          道具: z.record(z.string().describe('道具名'), z.string().describe('描述')).prefault({}),
          房产: z.record(z.string().describe('房产名'), z.string().describe('状态')).prefault({
            翡翠湾叠墅: '上下三层带地下一层，全款150万，五个房间还空着',
          }),
          车辆: z.record(z.string().describe('车辆名'), z.string().describe('状态')).prefault({}),
        })
        .prefault({}),
    })
    .prefault({}),

  // ── 任务：系统当前任务（完成或失效清空为空对象） ──
  任务: z
    .object({
      当前任务: z
        .object({
          标题: z.string().prefault(''),
          要求: z.string().prefault(''),
          奖励: z.string().prefault(''),
          期限: z.string().prefault(''), // 形如「第N天」
        })
        .prefault({}),
    })
    .prefault({}),

  // ── 产业：购入或系统返还的经营实体，键=产业名 ──
  产业: z.record(
    z.string().describe('产业名称'),
    z
      .object({
        基本信息: z
          .object({
            行业: z.string().prefault('未知'),
            成立时间: z.string().prefault(''),
            总部地点: z.string().prefault(''),
            公司规模: z.string().prefault('初创'),
          })
          .prefault({}),
        经营: z
          .object({
            主营业务: z.string().prefault(''),
            核心产品: z.record(z.string().describe('产品名'), z.string().describe('产品介绍')).prefault({}),
            业务数据: z.record(
              z.string().describe('指标名称(如：日均客流/日活用户等)'),
              z.string().describe('指标具体数值与描述'),
            ).prefault({}),
          })
          .prefault({}),
        资产与福利: z
          .object({
            固定资产: z.record(z.string().describe('资产名'), z.string().describe('数量与状态')).prefault({}),
            员工福利: z.record(z.string().describe('福利项'), z.string().describe('详情')).prefault({}),
          })
          .prefault({}),
        财务: z
          .object({
            月收入: z.coerce.number().prefault(0),
            月支出: z.coerce.number().prefault(0),
            现金流: z.coerce.number().prefault(0),
          })
          .prefault({}),
      })
      .prefault({}),
  ).prefault({}),

  // ── 红颜：登场女性角色唯一档案，键=名字（租客状态也在这里，不再另建角色表） ──
  红颜: z.record(
    z.string().describe('名字'),
    z
      .object({
        基本信息: z
          .object({
            年龄: z.coerce.number().prefault(18),
            职业: z.string().prefault('未知'),
            居住地: z.string().prefault('未知'),
          })
          .prefault({}),
        外貌: z
          .object({
            外貌描述: z.string().prefault(''),
            身材: z.string().prefault(''),
            衣着: z
              .object({
                日常衣着: z.string().prefault(''),
                当前衣着: z.string().prefault(''),
              })
              .prefault({}),
          })
          .prefault({}),
        情感: z
          .object({
            好感度: z.coerce.number().transform((v) => _.clamp(v, 0, 100)).prefault(0),
            爱意值: z.coerce.number().transform((v) => _.clamp(v, 0, 100)).prefault(0),
            怀疑值: z.coerce.number().transform((v) => _.clamp(v, 0, 100)).prefault(0),
            冲突值: z.coerce.number().transform((v) => _.clamp(v, 0, 100)).prefault(0),
          })
          .prefault({}),
        生理: z
          .object({
            生理期: z.string().prefault('未知'),
            是否处女: z.string().prefault('是'),
          })
          .prefault({}),
        租约: z
          .object({
            在住: z.boolean().prefault(false),
            房间: z.enum(['一楼东', '一楼西', '二楼东', '地下室', 'B栋', '空置']).prefault('空置'),
            欠租: z.coerce.number().prefault(0), // 到期未交累加，交租或免租清零
          })
          .prefault({}),
        私密档案: z
          .object({
            初吻: z.enum(['未发生', '已发生']).prefault('未发生'),
            初夜: z.enum(['未发生', '已发生']).prefault('未发生'),
            性交次数: z.coerce.number().prefault(0), // 只增不减
            最近性事: z.string().prefault('无'), // 「第N天·时段」，无=未发生
            身体开发: z
              .object({
                小嘴: z.coerce.number().transform((v) => _.clamp(v, 0, 100)).prefault(0),
                胸部: z.coerce.number().transform((v) => _.clamp(v, 0, 100)).prefault(0),
                下身: z.coerce.number().transform((v) => _.clamp(v, 0, 100)).prefault(0),
                后穴: z.coerce.number().transform((v) => _.clamp(v, 0, 100)).prefault(0),
              })
              .prefault({}),
          })
          .prefault({}),
        关系: z
          .object({
            关系: z.string().prefault('陌生人'), // 租客/房客→暧昧→恋人等，关系变化当轮改写
            态度: z.string().prefault('冷淡'),
          })
          .prefault({}),
        状态: z
          .object({
            心情: z.string().prefault('平静'),
            健康: z.string().prefault('健康'),
          })
          .prefault({}),
        羁绊物品: z.record(z.string().describe('物品名'), z.string().describe('描述及意义')).prefault({}),
        羁绊事件: z.record(z.string().describe('时间(第N天)'), z.string().describe('事件内容')).prefault({}),
      })
      .prefault({}),
  ).prefault({}),

  // ── NPC：非红颜人物，键=姓名，身份与关系均为键值明细 ──
  NPC: z.record(
    z.string().describe('姓名'),
    z
      .object({
        身份: z.record(z.string().describe('身份名'), z.string().describe('具体说明')).prefault({}),
        关系: z.record(z.string().describe('与主角的关系名'), z.string().describe('来历或现状说明')).prefault({}),
      })
      .prefault({}),
  ).prefault({}),

  // ── 别墅：主舞台经营状态 ──
  别墅: z
    .object({
      口碑: z.coerce.number().transform((v) => _.clamp(v, 0, 100)).prefault(0),
      设施等级: z.coerce.number().transform((v) => _.clamp(v, 0, 5)).prefault(0),
      空房数: z.coerce.number().transform((v) => _.clamp(v, 0, 5)).prefault(5), // 与红颜.租约联动
    })
    .prefault({}),

  // ── 系统_：只读统计，播报结算时由模型按规则累加 ──
  系统_: z
    .object({
      已触发事件: z.array(z.string()).prefault([]),
      统计: z
        .object({
          打脸次数: z.coerce.number().prefault(0),
          装逼评分最高: z.coerce.number().prefault(0),
          收编数: z.coerce.number().prefault(0),
          收租次数: z.coerce.number().prefault(0),
        })
        .prefault({}),
    })
    .prefault({}),

  // ── 选项：每轮恰好1个下一步行动短句，状态栏渲染为可点击行动签 ──
  选项: z.array(z.string()).prefault([]),
});

export type Schema = z.output<typeof Schema>;
