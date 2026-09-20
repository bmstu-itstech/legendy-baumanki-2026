import type { CSSProperties } from "react";

type Building = {
  /** Как называем здание на странице (пока только для читаемости кода). */
  label: string;
  /** Путь без суффикса: рядом лежат `<src>-gray.svg` (контур) и `<src>-color.svg` (с заливкой). */
  src: string;
  /** Размеры viewBox обоих файлов — у пары они совпадают, поэтому слои ложатся друг на друга. */
  width: number;
  height: number;
};

/**
 * Здание модуля — по порядку модуля. Чтобы добавить здание новому модулю, положите
 * пару `<name>-gray.svg` / `<name>-color.svg` в public/assets/buildings (viewBox обрезан
 * по зданию у обоих файлов) и допишите запись в конец списка. Пока для модуля здания нет,
 * в карточке показывается заглушка. Если бэкенд начнёт отдавать своё поле
 * (например, `building`), заменить выбор в `getModuleBuilding`.
 */
const BUILDINGS: Building[] = [
  { label: "Главное здание", src: "/assets/buildings/gz", width: 1836, height: 1187 },
  { label: "УЛК", src: "/assets/buildings/ulk", width: 1904, height: 1274 },
  { label: "Конгресс-центр", src: "/assets/buildings/congress", width: 1155, height: 1365 },
  { label: "Хим", src: "/assets/buildings/chem", width: 2093, height: 1333 },
];

/** Высота здания в карточке на широком экране; на узком здание уменьшается вместе с шириной. */
const BUILDING_HEIGHT = 180;

/** Здание модуля или `undefined`, если его ещё не нарисовали. */
export function getModuleBuilding(order: number) {
  return BUILDINGS[order - 1];
}

/** Заглушка того же размера, что и здание, — карточки не «прыгают» по высоте. */
function BuildingPlaceholder({ locked }: { locked: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`flex w-full items-center justify-center rounded-[14px] border-2 border-dashed border-secondary/25 text-[0.9375rem] font-bold uppercase tracking-wide text-secondary/45 ${
        locked ? "opacity-60" : ""
      }`}
      style={{ height: BUILDING_HEIGHT, maxWidth: 280 }}
    >
      Скоро здесь появится здание
    </div>
  );
}

/**
 * Здание-прогресс: снизу лежит контурный рисунок, поверх него — цветной, который
 * «заливается» снизу вверх по мере роста прогресса (`progress` от 0 до 1).
 * Оба файла обрезаны по границам здания, поэтому 50% прогресса — ровно половина здания.
 */
export function ModuleBuilding({
  order,
  progress,
  locked = false,
}: {
  order: number;
  progress: number;
  locked?: boolean;
}) {
  const building = getModuleBuilding(order);
  if (!building) return <BuildingPlaceholder locked={locked} />;

  const fill = Math.min(Math.max(progress, 0), 1);
  const showColor = !locked && fill > 0;

  return (
    <div
      aria-hidden="true"
      className={`relative w-full ${locked ? "opacity-40" : ""}`}
      style={{
        aspectRatio: `${building.width} / ${building.height}`,
        maxWidth: Math.round((BUILDING_HEIGHT * building.width) / building.height),
      }}
    >
      {/* Декоративные SVG из public: next/image для них не нужен. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${building.src}-gray.svg`}
        alt=""
        width={building.width}
        height={building.height}
        draggable={false}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full select-none"
      />
      {showColor ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${building.src}-color.svg`}
          alt=""
          width={building.width}
          height={building.height}
          draggable={false}
          loading="lazy"
          decoding="async"
          className="building-fill absolute inset-0 size-full select-none"
          style={{ "--building-top": `${(1 - fill) * 100}%` } as CSSProperties}
        />
      ) : null}
    </div>
  );
}
