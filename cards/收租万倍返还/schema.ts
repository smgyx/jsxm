// 《收租万倍返还》MVU 变量结构定义（Zod 4）
// 结构来源：创作规划.yaml → mvu.structure / mvu.variables
// 运行时已注入全局 z（Zod 4）与 _（lodash），此处禁止任何 import
// 约定：数字一律 z.coerce.number()；已声明的取值范围用 _.clamp 收敛而非拒绝；
//       动态增删的集合用 z.record；可被整体移除的对象用 .prefault({}) 兜底

export const Schema = z.object({
  // ── 世界：时间、幕与舞台 ──
  世界: z
    .object({
      日期: z.coerce.number().prefault(1), // 第N天；事件调度器用它比对节点表，开场停在第1天相亲席
      时段: z
        .enum(['清晨', '上午', '中午', '下午', '傍晚', '晚上', '深夜'])
        .prefault('下午'),
      当前地点: z.string().prefault('江城｜餐厅包间'), // 格式「区域｜场景」
      天气: z.string().prefault('八月底，闷热'),
      剧情节点: z
        .object({
          当前事件: z.string().prefault('无'), // 调度器唯一写入，值=节点表事件名
          当前节点: z.string().prefault('无'), // 切换事件时调度器重置为首节点，此后由模型推进
          下一个事件: z.string().prefault(''), // 调度器唯一写入：事件名|日期|首节点
        })
        .prefault({}),
    })
    .prefault({}),

  // ── 主角：登记信息、资产与系统成长线 ──
  主角: z
    .object({
      姓名: z.string().prefault('林野'), // 默认林野模板，开场登记可被玩家自定义覆写
      年龄: z.coerce.number().prefault(30), // 原著林野：三十岁，大厂十年
      性别: z.string().prefault('男'), // 默认林野模板，开场登记可被玩家自定义覆写
      身高: z.string().prefault('一米八二'), // 默认林野模板，开场登记可被玩家自定义覆写
      体型: z.string().prefault('久坐微堕，尚未被系统改造'), // 默认林野模板，开场登记可被玩家自定义覆写
      外貌: z.string().prefault('三十岁，大厂十年项目负责人，气质偏沉'), // 默认林野模板，开场登记可被玩家自定义覆写
      衣着: z.string().prefault('灰色T恤配黑色休闲裤'), // 默认林野模板，开局登记可被玩家自定义覆写
      已登记: z.boolean().prefault(false), // 开场「接手登记」完成当轮置为 true；状态栏凭此切换登记界面/游戏面板
      现金: z.coerce.number().prefault(500000), // 开局：补偿金减房款后约50万，系统尚未结算
      系统积分: z.coerce.number().prefault(0),
      神豪等级: z
        .enum(['萌新房东', '包租新人', '职业房东', '地产新贵', '收租大亨', '神豪'])
        .prefault('萌新房东'), // 与累计返利挂钩升级
      返现倍数: z.coerce.number().prefault(10000), // 万倍返还
      累计返利: z.coerce.number().prefault(0), // 开场尚未收租
      精力: z
        .object({
          当前值: z.coerce.number().prefault(100),
          上限: z.coerce.number().prefault(100),
        })
        .prefault({}),
      体力: z
        .object({
          当前值: z.coerce.number().prefault(100),
          上限: z.coerce.number().prefault(100),
        })
        .prefault({}),
      被动技能: z
        .array(
          z.enum(['黄金瞳', '商业洞察之眼', '黑客精通', '读心术限定版', '龙精虎猛', '百毒不侵']),
        )
        .prefault([]), // 开场系统刚绑定，技能随原著结算解锁
      技能次数: z
        .record(
          z.string().describe('主动技能名'),
          z.coerce.number().transform((value) => _.clamp(value, 0, 3)),
        )
        .prefault({}), // 主动技能当日剩余次数（读心术限定版/黄金瞳/商业洞察之眼，上限3）；解锁或跨天重置为3，使用一次-1
      名下产业: z
        .record(z.string().describe('产业名'), z.string().describe('产业简述'))
        .prefault({}), // 动态增删：翡翠湾大别墅/星耀传媒/月牙湾山庄/…
      日程约定: z
        .record(z.string().describe('约定对象或事项'), z.string().describe('约定内容'))
        .prefault({}), // 动态增删
    })
    .prefault({}),

  // ── 任务：系统任务线 ──
  任务: z
    .object({
      当前任务: z
        .object({
          标题: z.string().prefault(''),
          要求: z.string().prefault(''),
          奖励: z.string().prefault(''),
          期限: z.string().prefault(''), // 形如「第N天」
        })
        .prefault({}), // 可清空：任务完成/失效时整对象移除，解析时自动兜底
      任务板: z
        .array(
          z.object({
            标题: z.string().prefault(''),
            要求: z.string().prefault(''),
            奖励: z.string().prefault(''),
            期限: z.string().prefault(''),
          }),
        )
        .prefault([]),
    })
    .prefault({}),

  // ── 角色：动态 record，键=角色名，可在游戏中增删 ──
  角色: z
    .record(
      z.string().describe('角色名'),
      z
        .object({
          在住: z.boolean().prefault(false),
          房间: z.enum(['一楼东', '一楼西', '二楼东', '地下室', 'B栋', '空置']).prefault('空置'),
          好感: z.coerce
            .number()
            .prefault(0)
            .transform((value) => _.clamp(value, 0, 100)), // 0~100，受用/帮忙+1~3，冒犯/失望-1~3，单轮±3封顶
          堕落: z.coerce
            .number()
            .prefault(0)
            .transform((value) => _.clamp(value, 0, 100)), // 0~100，仅实质亲密回合+1~3，日常回合不动
          情绪: z.string().prefault(''), // 自由短文本
          心理想法: z.string().prefault(''), // 一两句第一人称
          欠租: z.coerce.number().prefault(0),
          个人目标: z.string().prefault(''),
          生理期: z.enum(['安全期', '普通期', '排卵期', '月经期']).prefault('安全期'), // 擦边机制参考
          私密档案: z
            .object({
              初吻: z.enum(['未发生', '已发生']).prefault('未发生'),
              初夜: z.enum(['未发生', '已发生']).prefault('未发生'), // 由性交次数首次+1联动写入，AI不得直接改写
              性交次数: z.coerce.number().prefault(0), // 只增不减（由变量更新规则约束）
              最近性事: z.string().prefault('无'), // 格式「第N天·时段」；无=未发生，仅发生回合更新
              身体开发: z
                .object({
                  小嘴: z.coerce
                    .number()
                    .prefault(0)
                    .transform((value) => _.clamp(value, 0, 100)),
                  胸部: z.coerce
                    .number()
                    .prefault(0)
                    .transform((value) => _.clamp(value, 0, 100)),
                  下身: z.coerce
                    .number()
                    .prefault(0)
                    .transform((value) => _.clamp(value, 0, 100)),
                  后穴: z.coerce
                    .number()
                    .prefault(0)
                    .transform((value) => _.clamp(value, 0, 100)),
                })
                .prefault({}), // 各0~100，只增不减，上限受该角色堕落值钳制
            })
            .prefault({}),
        })
        .prefault({}),
    )
    .prefault({}),

  // ── 红颜：已建立亲密或长期羁绊的女主，键=角色名 ──
  红颜: z
    .record(
      z.string().describe('角色名'),
      z
        .object({
          关系: z.string().prefault(''),
          好感: z.coerce
            .number()
            .prefault(0)
            .transform((value) => _.clamp(value, 0, 100)),
          态度: z.string().prefault(''),
          当前状态: z.string().prefault(''),
        })
        .prefault({}),
    )
    .prefault({}),

  // ── 人物：尚未收编、或不必进租客档案的在场者，键=姓名 ──
  人物: z
    .record(
      z.string().describe('人物名'),
      z
        .object({
          身份: z.string().prefault(''),
          与主角关系: z.string().prefault(''),
          当前状态: z.string().prefault(''),
        })
        .prefault({}),
    )
    .prefault({}),

  // ── 别墅：主舞台经营状态 ──
  别墅: z
    .object({
      口碑: z.coerce
        .number()
        .prefault(0)
        .transform((value) => _.clamp(value, 0, 100)), // 0~100，幕四山庄业务线与结局评级引用
      设施等级: z.coerce
        .number()
        .prefault(0)
        .transform((value) => _.clamp(value, 0, 5)), // 0~5，改造需现金+设施等级前置
      空房数: z.coerce
        .number()
        .prefault(5)
        .transform((value) => _.clamp(value, 0, 5)), // 0~5，开场五间都空着；收编新租客需空房数≥1
    })
    .prefault({}),

  // ── 系统_：脚本管理，AI 只读（豁免由变量更新规则文件处理） ──
  系统_: z
    .object({
      已触发事件: z.array(z.string()).prefault([]), // 关键事件名，幕门槛判定用
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

  // ── 选项：每轮的行动选项（AI 经变量块写入，状态栏渲染为可点击行动签）──
  选项: z.array(z.string()).prefault([]),
});

export type Schema = z.output<typeof Schema>;
