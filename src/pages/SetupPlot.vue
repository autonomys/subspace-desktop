<template lang="pug">
q-page.q-pa-lg.q-mr-lg.q-ml-lg
  .row.justify-center.q-mb-md
    .text-h4 {{ $t('setupPlot.pageTitle') }}
  .row.justify-center
    p {{ $t('setupPlot.infoDialog') }}
  .row.justify-center.q-mr-lg.q-ml-lg
    .col
      .row
        .col.q-mt-sm
          div {{ $t('setupPlot.plotsDirectory') }}
          q-input.q-field--highlighted(
            :error="!validPath"
            :error-message="$t('setupPlot.invalidDir')"
            color="blue"
            dense
            input-class="setupPlotInput"
            outlined
            v-model="store.plotPath"
          )
            template(v-slot:after)
              q-btn.shadow-0(
                @click="selectDir()"
                color="blue"
                flat
                icon="folder"
                size="lg"
              )
      .row.items-center.q-gutter-md
        .col-4
          .row
            .col.q-pr-md
              .q-mt-sm {{ $t('setupPlot.utilized') }}
              q-input.bg-grey-3(
                dense
                input-class="setupPlotInput"
                outlined
                readonly
                suffix="GB"
                v-model="stats.utilizedGB"
              )
                q-tooltip.q-pa-sm
                  p {{ $t('setupPlot.utilizedSpace') }}
              .q-mt-sm {{ $t('setupPlot.available') }}
              q-input(
                :error="unsafeFree"
                dense
                hide-bottom-space
                input-class="setupPlotInput"
                outlined
                readonly
                suffix="GB"
                v-model="stats.freeGB"
              )
                q-tooltip.q-pa-sm
                  p {{ $t('setupPlot.availableSpace') }}
              .q-mt-sm {{ $t('setupPlot.allocated') }}
              // TODO: remove validation and restrict input to positive numbers when possible (Quasar component limitation)
              q-input(
                type="number"
                bg-color="blue-2"
                dense
                input-class="setupPlotInput"
                outlined
                suffix="GB"
                v-model.number="store.plotSizeGB"
                :rules="[val => val > 0 || $t('setupPlot.allocatedErrorMsg'), val => val <= 100 || $t('setupPlot.plotSizeLimitErrorMsg')]"
              )
                q-tooltip.q-pa-sm
                  p {{ $t('setupPlot.allocatedSpace') }}

        .col.q-pr-md
          .row.justify-center(
            style="transform: scale(-1, 1)"
          )
            apexchart(
              :options="chartOptions"
              :series="chartData"
              type="donut"
              width="200px"
            )
          .row.q-mt-md
            .col-1
            .col
              q-slider(
                :max="stats.safeAvailableGB"
                :min="1"
                :step="5"
                color="blue"
                snap
                style="height: 25px"
                v-model="store.plotSizeGB"
              )
            .col-1
  .row.justify-end.q-mt-sm.absolute-bottom.q-pb-md
    .col-auto.q-pr-md
      div {{ $t('setupPlot.hint') }}
    .col.q-pr-md
      div {{ $t('setupPlot.hint2') }}
    .col-expand
    .col-auto
      q-btn(
        :disable="(!validPath || store.plotSizeGB <= 0 || store.plotSizeGB > 100)"
        @click="confirmCreateDir()"
        color="blue-8"
        icon-right="downloading"
        :label="$t('setupPlot.start')"
        outline
        size="lg"
      )
      q-tooltip.q-pa-md(v-if="!validPath")
        p.q-mb-lg {{ $t('setupPlot.tooltip') }}
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { debounce } from 'quasar';
import * as tauri  from '@tauri-apps/api';
import { ApexOptions } from 'apexcharts';

import { ChartDataType, StatsType } from '../lib/types';
import * as native from '../lib/native';
import * as plotDir from '../lib/plotDir';
import mnemonicModal from '../components/mnemonicModal.vue';
import { useStore } from '../stores/store';
import * as util from '../lib/util';
import * as directoryDialogs from '../components/directoryDialogs';

const chartOptions: ApexOptions = {
  legend: { show: false },
  colors: ['#E0E0E0', '#FFFFFF', '#2081F0'],
  plotOptions: {
    pie: {
      startAngle: 0,
      endAngle: 360,
      expandOnClick: false,
      donut: { size: '40px' }
    }
  },
  dataLabels: { enabled: false },
  labels: [],
  states: {
    active: { filter: { type: 'none' } },
    hover: { filter: { type: 'none' } }
  },
  markers: { hover: { size: 0 } },
  tooltip: { enabled: false }
};

// TODO: consider moving client, tauri and native methods elsewhere - use store methods instead
export default defineComponent({
  setup() {
    const store = useStore();
    return { store };
  },
  data() {
    return {
      revealKey: false,
      validPath: true,
      driveStats: <native.DriveStats>{ freeBytes: 0, totalBytes: 0 },
      chartOptions,
    };
  },
  computed: {
    chartData(): ChartDataType {
      return [
        this.stats.utilizedGB,
        this.stats.freeGB,
        // small hack to make chart look better, otherwise plot size is not visible
        this.store.plotSizeGB < 5 ? this.store.plotSizeGB + 5 :
          this.store.plotSizeGB < 10 ? this.store.plotSizeGB + 3 :
            this.store.plotSizeGB
      ];
    },
    stats(): StatsType {
      const totalDiskSizeGB = util.toFixed(this.driveStats.totalBytes / 1e9, 2);
      // node will occupy AT MOST 10GB (safe margin), so deduct 10GB from safe space
      const safeAvailableGB = this.driveStats.freeBytes / 1e9 - 10;
      const utilizedGB = util.toFixed(totalDiskSizeGB - safeAvailableGB, 2);
      const freeGB = ((): number => {
        const val = util.toFixed(safeAvailableGB - this.store.plotSizeGB, 2);
        if (val >= 0) {
          return val;
        } else {
          return 0;
        }
      })();

      return {
        totalDiskSizeGB,
        safeAvailableGB,
        utilizedGB,
        freeGB
      };
    },
    unsafeFree(): boolean {
      return this.stats.freeGB < 20;
    }
  },
  watch: {
    'stats.freeGB'(val) {
      if (val < 0) {
        this.$nextTick(() => {
          this.stats.freeGB = 0;
          console.log(this.stats.freeGB);
        });
      }
    },
    'store.plotSizeGB'(val) {
      // input component currently allows negative numbers as value, so we need to check
      if (val >= 0) {
        if (!this.stats?.safeAvailableGB) return;
        if (val > this.stats?.safeAvailableGB) {
          this.$nextTick(() => {
            const size = parseFloat(this.stats?.safeAvailableGB.toFixed(0));
            this.store.setPlotSize(size);
          });
        } else {
          this.$nextTick(() => {
            const size = util.toFixed(this.store.plotSizeGB, 2);
            this.store.setPlotSize(size);
          });
        }
      } else {
        this.store.setPlotSize(0);
      }
    }
  },
  async mounted() {
    await this.updateDriveStats();
    const path = (await tauri.path.dataDir()) + util.appName + util.PLOT_FOLDER;
    this.store.setPlotPath(path);
  },
  async created() {
    this.$watch(
      'store.plotPath',
      debounce((val): null => {
        if (val.length === 0) {
          this.validPath = false;
        } else {
          // TODO: check if path is valid on any OS
          this.validPath = true;
        }
        return null;
      }, 500)
    );
  },
  methods: {
    async confirmCreateDir() {
      const dirExists = await native.dirExists(this.store.plotPath);

      if (dirExists) {
        util.infoLogger('SETUP PLOT | found the old plotting directory');
        const files = await tauri.fs
          .readDir(this.store.plotPath)
          .catch((error) => {
            util.errorLogger(error);
          });

        if (files) {
          console.log('FILES ARE: :', files);
          if (files.length === 0) {
            directoryDialogs.existingDirectoryConfirm(this.store.plotPath, this.startPlotting);
            // we are in FIRST TIME START, meaning there is are no existing plot
            // if there are some files in this folder, it's weird
          } else {
            directoryDialogs.notEmptyDirectoryInfo(this.store.plotPath);
          }
        }
      } else if (!dirExists) {
        directoryDialogs.newDirectoryConfirm(this.store.plotPath, this.startPlotting);
      }
    },
    async startPlotting() {
      await plotDir.createPlotDir(this.store.plotPath);
      util.infoLogger('SETUP PLOT | custom directory created');

      if (!this.store.rewardAddress) {
        util.infoLogger('SETUP PLOT | reward address was empty, creating a new one');
        await util.showModal(mnemonicModal, { handleConfirm: this.handleConfirm });
      } else {
        util.infoLogger('SETUP PLOT | reward address was initialized before, proceeding to plotting');
        await this.handleConfirm();
      }
    },
    async handleConfirm() {
      await this.store.confirmPlottingSetup(this.$config, util);
      this.$router.replace({ name: 'plottingProgress' });
    },
    async updateDriveStats() {
      const dirExists = await native.dirExists(this.store.plotPath);

      if (!dirExists) {
        await tauri.fs.createDir(this.store.plotPath).catch((error) => {
          util.errorLogger(error);
        });
      }

      const stats = await native.driveStats(this.store.plotPath);
      util.infoLogger('Drive Stats -> free: ' + stats.freeBytes + '; total: ' + stats.totalBytes);
      this.driveStats = stats;
    },
    async selectDir() {
      const result = await native
        .selectDir(this.store.plotPath)
        .catch((error: unknown) => {
          util.errorLogger(error);
        });
      if (result) {
        this.store.setPlotPath(result);
      }
      await this.updateDriveStats();
    },
  }
});
</script>

<style lang="sass">
.setupPlotInput
  font-size: 20px
  padding-top: 5px
  margin-top: 0px
</style>
