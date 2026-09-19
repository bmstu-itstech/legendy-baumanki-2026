const mediaNotes = ["0..4 медиа", "Медиа:\nФото,\nВидео,\nАудио"];

export function TaskDetailPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-2 py-6 sm:px-6 lg:px-10">
      <div className="mb-4 text-[0.9rem] font-bold uppercase tracking-[-0.03em] text-[#1d2532]">
        <span>Название модуля</span>
        <span className="px-2">&rarr;</span>
        <span>Задание #0123</span>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-start">
        <main className="min-w-0">
          <h1 className="font-hand text-[clamp(2.4rem,4vw,4.2rem)] leading-[0.9] tracking-[-0.04em] text-[#f1a9b3]">
            Название задания
          </h1>

          <div className="mt-6 max-w-[720px] space-y-6">
            <p className="text-[1.15rem] leading-[1.6] text-[#1d2532]/80">
              Описание задания. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliquam quaerat voluptate. Ut
              enim adque doloremus, cum corpore dolus, fiei tamen per magna accession potest, si
              aliquo adternum et.
            </p>

            <section>
              <h2 className="text-[2.5rem] font-bold uppercase leading-none tracking-[-0.04em] text-[#1d2532]">
                Задание
              </h2>
              <p className="mt-4 max-w-[720px] text-[1.05rem] leading-[1.7] text-[#1d2532]/80">
                Описание задания. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliquam quaerat voluptate.
              </p>
            </section>

            <div className="mt-2 flex flex-wrap items-start gap-4">
              <div className="w-full max-w-[560px] overflow-hidden rounded-[4px] border-[3px] border-[#0d1c2c] bg-[#dfe9f5] shadow-[0_0_0_2px_rgba(13,28,44,0.05)]">
                <img
                  src="https://images.unsplash.com/photo-1528747045269-390fe33c19f2?auto=format&fit=crop&w=1200&q=80"
                  alt="Задание"
                  className="block h-[260px] w-full object-cover"
                />
              </div>

              <div className="flex flex-col gap-3">
                {mediaNotes.map((note, index) => (
                  <div
                    key={note}
                    className="w-[125px] rounded-[4px] border-[1px] border-[#1d2532]/30 bg-[#f5df8c] px-3 py-2 text-[0.9rem] leading-[1.1] text-[#1d2532] shadow-[0_2px_0_rgba(0,0,0,0.10)]"
                    style={{ transform: index === 0 ? "translateY(8px)" : "none" }}
                  >
                    {note.split("\n").map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-end gap-5">
              <div className="min-w-[200px] flex-1 max-w-[420px]">
                <div className="mb-2 text-[0.95rem] font-bold uppercase text-[#1d2532]">Ответ</div>
                <input
                  type="text"
                  placeholder=""
                  className="w-full border-[2px] border-[#1d2532] bg-transparent px-4 py-3 text-[1.1rem] text-[#1d2532] outline-none placeholder:text-[#1d2532]/40"
                />
              </div>

              <div className="w-[138px] rounded-[4px] border-[1px] border-[#1d2532]/20 bg-[#f5df8c] px-3 py-2 text-[0.9rem] leading-[1.2] text-[#1d2532] shadow-[0_2px_0_rgba(0,0,0,0.10)]">
                Регулярка
                <div className="mt-1">(если есть)</div>
                <div className="mt-1">с бока</div>
              </div>
            </div>

            <div className="mt-8 max-w-[720px] text-[1.05rem] leading-[1.7] text-[#1d2532]/80">
              <span className="font-bold">Текст-пояснение.</span> Lorem ipsum dolor sit amet,
              consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
              magna aliquam quaerat voluptate.
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="min-w-[170px] border-[2px] border-[#1d2532] bg-transparent px-6 py-3 text-[1.05rem] font-bold uppercase text-[#1d2532] transition hover:-translate-y-0.5"
              >
                Отправить
              </button>
              <button
                type="button"
                className="min-w-[170px] border-[2px] border-[#1d2532] bg-transparent px-6 py-3 text-[1.05rem] font-bold uppercase text-[#1d2532] transition hover:-translate-y-0.5"
              >
                Пропустить
              </button>
            </div>
          </div>
        </main>

        <aside className="space-y-6 pt-2 xl:pt-16">
          <div className="rounded-[6px] border-[1px] border-[#1d2532]/10 bg-[#f7f7f5] px-4 py-3 shadow-[0_2px_0_rgba(0,0,0,0.06)]">
            <div className="text-[0.9rem] font-bold uppercase leading-tight text-[#1d2532]/75">
              Время выполнения задан...
            </div>
            <div className="mt-4 text-center text-[2.1rem] font-bold tracking-[-0.05em] text-[#1d2532]">
              0:10:34
            </div>
            <div className="mt-4 flex gap-3">
              <div className="flex-1 rounded-[4px] border border-[#1d2532]/15 bg-[#f4df8b] px-3 py-2 text-center text-[0.7rem] font-bold uppercase leading-[1.2] text-[#1d2532]">
                <div>Текущее</div>
                <div>время</div>
                <div>выполнения</div>
                <div>задания</div>
              </div>
              <div className="flex-1 rounded-[4px] border border-[#1d2532]/15 bg-[#f2c7bb] px-3 py-2 text-center text-[0.7rem] font-bold uppercase leading-[1.2] text-[#1d2532]">
                <div>Перенести</div>
                <div>в другое</div>
                <div>место</div>
              </div>
            </div>
          </div>

          <div className="rounded-[4px] border-[1px] border-[#1d2532]/15 bg-[#f4df8b] px-3 py-2 text-[0.74rem] leading-[1.4] text-[#1d2532] shadow-[0_2px_0_rgba(0,0,0,0.10)]">
            <div className="font-bold uppercase">Отметить</div>
            <div>если задача</div>
            <div>не нужна</div>
          </div>

          <div className="rounded-[4px] border-[1px] border-[#1d2532]/15 bg-[#f4df8b] px-3 py-2 text-[0.74rem] leading-[1.4] text-[#1d2532] shadow-[0_2px_0_rgba(0,0,0,0.10)]">
            <div className="font-bold uppercase">Если статус</div>
            <div>кнопки</div>
            <div>неактивен</div>
          </div>

          <div className="rounded-[4px] border-[1px] border-[#1d2532]/15 bg-[#f4df8b] px-3 py-2 text-[0.74rem] leading-[1.4] text-[#1d2532] shadow-[0_2px_0_rgba(0,0,0,0.10)]">
            <div className="font-bold uppercase">При нажатии</div>
            <div>на пропустить</div>
            <div>выводится</div>
            <div>сообщение, что</div>
            <div>если вы</div>
            <div>пропустите, то</div>
            <div>не получите</div>
            <div>баллов</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
