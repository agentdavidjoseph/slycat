# Copyright 2013 National Technology & Engineering Solutions of Sandia, LLC (NTESS). 
# Under the terms of Contract DE-NA0003525 with NTESS, the U.S. Government 
# retains certain rights in this software.
#
# This is a Python command line script which decomposes a set
# of movies into pairwise distance matrices and trajectories
# for the VideoSwarm application.  The inputs to this script are
# a .csv file containing meta data, a column number in the .csv file
# (indexed from 1) indicating the movie file names to use for the
# distance matrix calculations, and a directory name (must exist)
# to write out the necessary VideoSwarm files.
#
# S. Martin
# 9/15/2017


# input parser
import argparse

# reading files, parsing file names
import os
import csv
import urllib.parse

# error handling
import sys

# video processing
# cv2 has been replaced by imageio
# import cv2
import imageio

# parallel computations
import ipyparallel

# computing distance matrices and coordinates
import numpy
from sklearn.metrics.pairwise import euclidean_distances

# estimating time to complete
import time
import logging
import itertools

# create movies
import ffmpy
from os import listdir


# subroutines
#############

# log file handler
def create_job_logger(file_name):
    """
    returns a logging function with the jid.log as the file name
    changed to print for compatibility for hpc
    :param jid: job id
    :return:
    """
    return lambda msg: print(msg, flush = True)


# start of main script
######################

# define command line parser

# provide description
parser = argparse.ArgumentParser(
    description="Computes MDS coordinates for video frames "
                "and trajectories for use by the VideoSwarm  "
                "Slycat plugin.  "
                "The output files are in the VideoSwarm format "
                "with the names movies.trajectories, movies.xcoords "
                "movies.ycoords, and movies.csv.  "
                "Note: the \"output\" directory must already exist.")

# mandatory root path for wind farm
parser.add_argument("--csv_file",
                    help="the .csv file containing the meta data for the videos "
                         "to be processed.")

# mandatory root path for wind farm
parser.add_argument("--log_file", default=None,
                    help="log file for job status (optional)")

# mandatory argument for column of movies
parser.add_argument("--movie_dir",
                    help="directory to write movies to.")

# madatory argument for column of frames
parser.add_argument("--frame_col",
                    help="column number (indexed by 1) with the frame files "
                         "to be processed, first frame only.  Note that frame "
                         "files are expected to be of the format *.#.*, "
                         "where * is the video name (and does not vary by frame), "
                         "# is the frame number in the video, "
                         "and the last * is the file type extension.")

# mandatory argument for output directory
parser.add_argument("--output_dir",
                    help="output directory for the VideoSwarm movie files "
                         "(must already exist)")

# optional argument for number of dimensions to use for alignment
parser.add_argument("--num_dim", default=10,
                    help="number of dimensions to use  for alignment between frames.")

# optional argument for percent energy to use for alignment
parser.add_argument("--energy", default=None,
                    help="percent of energy to use for alignment (takes precedent over num_dim).")

# optional argument for known duration of video
parser.add_argument("--fps", dest="fps", default=25,
                    help="frame per second, if known.  If unknown the script will "
                         "default to 25 fps.")

# parse arguments and distribute to variables
args = parser.parse_args()

# set up log file, or print to screen (default)
if args.log_file:
    log = create_job_logger(args.log_file)
else:
    def log(msg):
        print(msg, flush = True)

# check to see if mandatory arguments are present
if args.csv_file == None:
    log("[VS_LOG] Error: .csv file not specified.")
    sys.exit()

# if args.movie_col == None:
#     log("[VS-LOG] Error: movie column must be specified.")
#     sys.exit()

if args.frame_col == None:
    log("[VS-LOG] Error: frame column must be specified.")
    sys.exit()

if args.output_dir == None:
    log("[VS-LOG] Error: output directory not specified.")
    sys.exit()

if args.movie_dir == None:
    log("[VS-LOG] Error: movie directory not specified.")
    sys.exit()

if not os.path.exists(args.movie_dir):
    os.makedirs(args.movie_dir)

# set up ipython processor pool
try:
    pool = ipyparallel.Client(profile=None)
    pool = pool.direct_view()
except Exception as e:
    log(str(e))
    raise Exception("A running IPython parallel cluster is required to run this script.")

# check limits on number dimensions
num_dim = int(float(args.num_dim))
if num_dim < 2:
    log("[VS-LOG] Error: number dimensions must be >= 2.")
    sys.exit()

# check limits on percent energy
use_energy = False
energy = 0
if args.energy != None:
    energy = float(args.energy)
    if energy <= 0 or energy > 100:
        log("[VS-LOG] Error: percent energy must be > 0 and <= 100.")
        sys.exit()
    else:
        use_energy = True
        energy = float(args.energy)

# initial reading of .csv file
##############################

# read csv file
log("[VS-LOG] Reading " + str(args.csv_file) + " ...")
csv_file = open(args.csv_file)
meta_data = list(csv.reader(csv_file))
csv_file.close()

num_rows = len(meta_data) - 1
num_movies = num_rows
# get file names of movies

# movie_files = [movie_file[int(10) - 1] for movie_file in meta_data]
# movie_files = movie_files[1:]

# get file names of frames
frame_files = [frame_file[int(args.frame_col) - 1] for frame_file in meta_data]
frame_files = frame_files[1:]

# identify all frame files and order them by frame number
log("[VS-LOG] Locating and ordering frame files ...")

movies_exist = False
for fname in os.listdir(args.movie_dir):
    if fname.endswith('.mp4'):
        movies_exist = True
        log("[VS-LOG] MP4 files located. Skipping movie creation.")
        break


num_frames = 0
all_frame_files = []
all_movies = []
all_movies.append("movie_files")
for i in range(0, num_rows):
    # isolate first frame file
    frame_file_path, frame_file_name = \
        os.path.split(urllib.parse.urlparse(frame_files[i]).path)

    split_path = frame_files[i].split(frame_file_path)
    # Get the frame name, including number and file extension
    frame_name = split_path[1].split('/')[1]
    # Get the identifier name only
    identifier = frame_name.split('.')[0]

    file_location = split_path[0]
    # check 
    if args.movie_dir[-1] == '/':
        movie_output = args.movie_dir + identifier + '_%d.mp4' % (i+1)
    else:
        movie_output = args.movie_dir + '/' + identifier + '_%d.mp4' % (i+1)

    all_movies.append(file_location + movie_output)
    movie_input = frame_file_path + + '/' + identifier + '*.jpg'

    if replace_movies:
        #create the movie
        ff = ffmpy.FFmpeg(
            inputs={None: ['-pattern_type', 'glob'],
                movie_input: None},
            outputs={None: ['-force_key_frames', '0.0,0.04,0.08', '-vcodec', 'libx264', '-acodec', 'aac'],
            movie_output: None}
        )
        ff.run()

    log("[VS-LOG] Creating movie %d" % (i))

    # check for at least two dots in frame file name
    frame_split = frame_file_name.split('.')
    if len(frame_split) < 3:
        log("[VS-LOG] Error: incorrect frame file name format.")
        sys.exit()

    # get root file name, frame #, and extension
    frame_ext = frame_split[-1]
    frame_num = frame_split[-2]
    frame_root = ".".join(frame_split[0:-2])

    # get all files in frame path
    files_in_path = os.listdir(frame_file_path)

    # restrict to files with same root name
    frames_in_path = []
    frame_nums_in_path = []
    for j in range(0, len(files_in_path)):

        # get root file name
        file_split = files_in_path[j].split(".")

        # only consider files with at least two dots
        if len(file_split) < 3:
            continue

        # only consider files with same extension
        file_ext = file_split[-1]
        if file_ext != frame_ext:
            continue

        # get file root & frame num
        file_root = ".".join(file_split[0:-2])
        file_num = file_split[-2]

        # compare to file root of frames of interest
        if frame_root == file_root:
            frames_in_path.append(files_in_path[j])
            frame_nums_in_path.append(int(file_num))

    # order frames in path by frame number
    all_frame_files.append([os.path.join(frame_file_path, frames_in_path[j])
                            for j in numpy.argsort(frame_nums_in_path)])
    # check that all movie have same number of frames
    if i == 0:
        num_frames = len(all_frame_files[i])
    elif num_frames != len(all_frame_files[i]):
        # log("[VS-LOG] Error: inconsistent number of frames for video " + str(movie_files[i]))
        log("[VS-LOG] Error: inconsistent number of frames for video")
        sys.exit()

# try to read image
try:
    #frame = cv2.imread(all_frame_files[0][0])
    frame = imageio.imread(all_frame_files[0][0])
except:
    log("[VS-LOG] Error: could not read frame " + str(all_frame_files[0][0]))
    sys.exit()

# may succeed and be empty
if frame is None:
    log("[VS-LOG] Error: could not read frame " + str(all_frame_files[0][0]))
    sys.exit()

num_pixels = numpy.size(frame)

# get duration of video based on number of frames and fps
vid_duration = num_frames / float(args.fps)
log("[VS-LOG] Estimated video duration is: " + str(vid_duration) + " seconds.")

# distance matrix/MDS calculations
##################################

# create a list of numpy arrays for distance matrices between frames
frames = numpy.ones((num_rows, num_pixels))
xcoords = numpy.ones((num_frames, num_rows))
ycoords = numpy.ones((num_frames, num_rows))

# estimate time for entire run
start_time = time.time()

def compute(frame_number, input_num_movies, input_frame_files, input_use_energy, input_num_dim, input_num_pixels):
    import sys

    # cv2 has been replaced by imageio
    # import cv2
    import imageio

    from sklearn.metrics.pairwise import euclidean_distances
    import numpy
    import traceback
    input_frames = numpy.ones((input_num_movies, input_num_pixels))
    msg=''
    # cmdscale translation from Matlab by Francis Song
    # modified to be more robust in low dimensions/singular conditions
    def cmdscale(D):
        """                                                                                      
        Classical multidimensional scaling (MDS)                                                 

        Parameters                                                                               
        ----------                                                                               
        D : (n, n) array                                                                         
            Symmetric distance matrix.                                                           

        Returns                                                                                  
        -------                                                                                  
        Y : (n, p) array                                                                         
            Configuration matrix. Each column represents a dimension. Only the                   
            p dimensions corresponding to positive eigenvalues of B are returned.                
            Note that each dimension is only determined up to an overall sign,                   
            corresponding to a reflection.                                                       

        e : (n,) array                                                                           
            Eigenvalues of B.                                                                                                                                                       
        """

        # Number of points
        n = len(D)

        # Centering matrix
        H = numpy.eye(n) - numpy.ones((n, n)) / n

        # YY^T
        B = -H.dot(D ** 2).dot(H) / 2

        # Diagonalize
        evals, evecs = numpy.linalg.eigh(B)

        # Sort by eigenvalue in descending order
        idx = numpy.argsort(evals)[::-1]
        evals = evals[idx]
        evecs = evecs[:, idx]

        # Compute the coordinates using positive-eigenvalued components only
        w, = numpy.where(evals >= 0)
        L = numpy.diag(numpy.sqrt(evals[w]))
        V = evecs[:, w]
        Y = V.dot(L)

        # if only one coordinate then add two columns of zeros
        if len(w) == 1:
            Y = numpy.append(numpy.reshape(Y, (Y.shape[0], 1)),
                            numpy.zeros((Y.shape[0], 2)), axis=1)

        # if only two coordinates then add one column of zeros
        if len(w) == 2:
            Y = numpy.append(Y, numpy.zeros((Y.shape[0], 1)), axis=1)

        return Y, evals
    try:
        # read in one frame for all movies with openCV
        for j in range(0, input_num_movies):

            # get frame i
            try:
                # frame_i = cv2.imread(input_frame_files[j])
                frame_i = imageio.imread(input_frame_files[j])
            except Exception as e:
                msg=str(e)
                return msg

            # check for empty image file
            if frame_i is None:
                msg = 'frame_i is None'
                return msg

            # save frame pixels
            input_frames[j, :] = frame_i.astype(float).reshape(input_num_pixels)

        # now compute distance for frame i
        dist_mat = euclidean_distances(input_frames) / 255.0

        # now compute MDS for frame i
        mds_coords, evals = cmdscale(dist_mat)

        # re-compute num_dim on first pass if energy is specified
        if (input_use_energy and (i == num_frames-1)):

            # set num_dims according to percent
            energy_evals = numpy.cumsum(evals) / numpy.sum(evals)
            energy_dim = numpy.where(energy_evals >= energy/100)
            if len(energy_dim[0]) == 0:
                input_num_dim = len(energy_evals)

            else:
                input_num_dim = max(1,numpy.amin(energy_dim)) + 1

        # truncate mds coords
        if mds_coords.shape[1] >= input_num_dim:
            curr_coords = mds_coords[:,0:input_num_dim]

        else:
            curr_coords = numpy.concatenate((mds_coords, \
                          numpy.zeros((input_num_movies, input_num_dim - mds_coords.shape[1]))), axis=1)
        return curr_coords
    except Exception as e:
        msg = str(e)
        return traceback.format_exc()

GROUP_SIZE=50
# truncated coordinates are ordered from last to first
frame_numbers = [frame_number for frame_number in range(num_frames-1, -1, -1)]
list_num_movies = list(itertools.repeat(num_movies, GROUP_SIZE))
#organize the frame file for parallel
list_frame_files = []
for frame_number in frame_numbers:
    accumulator = []
    for j in range(0, num_movies):
        accumulator.append(all_frame_files[j][frame_number])
    list_frame_files.append(accumulator)
list_frames = list(itertools.repeat(frames, GROUP_SIZE))
list_use_energy = list(itertools.repeat(use_energy, GROUP_SIZE))
list_num_dim = list(itertools.repeat(num_dim, GROUP_SIZE))
list_num_pixels = list(itertools.repeat(num_pixels, GROUP_SIZE))
log("[VS-PROGRESS] " + str(5.0))
log("[VS-LOG] Sending compute jobs to nodes, this may take a while depending on job size...")
start = 0
step = 0
all_curr_coords = []
progress = 0
# GROUPing algorithm
while step <= len(frame_numbers):
    step = step + GROUP_SIZE
    start = step - GROUP_SIZE
    stop = step
    temp_curr_coords = None
    # run the GROUP for the last set of frames smaller than the GROUP size
    if step >= len(frame_numbers):
        remainder = len(frame_numbers)%GROUP_SIZE
        stop = remainder + start
        temp_curr_coords = pool.map_sync(compute,
                                         frame_numbers[start:stop],
                                         list_num_movies[0:remainder],
                                         list_frame_files[start:stop],
                                         list_use_energy[0:remainder],
                                         list_num_dim[0:remainder],
                                         list_num_pixels[0:remainder])
    # run the GROUP for the current GROUP size of frames
    else:
        temp_curr_coords = pool.map_sync(compute,
                                         frame_numbers[start:stop],
                                         list_num_movies,
                                         list_frame_files[start:stop],
                                         list_use_energy,
                                         list_num_dim,
                                         list_num_pixels)
        log("[VS-LOG] %s/%s frames computed"%(stop, len(frame_numbers)))
    if temp_curr_coords is not None:
        for coord in temp_curr_coords:
            all_curr_coords.append(coord)
    # estimated percentage complete
    progress = progress + round(GROUP_SIZE/len(frame_numbers) * 100.0)
    # make sure it's a number between 0 and 100
    if progress > 100.0:
        progress = 100.0
    if progress < 0.0:
        progress = 0.0

    # record into log for polling code
    log("[VS-PROGRESS] " + str(progress))
log("[VS-PROGRESS] " + str(100.0))
# keeping a linear calculation example here
# all_curr_coords = [compute(frame_number, num_movies, all_frame_files, use_energy, num_dim, num_pixels) for frame_number in frame_numbers]

time_elapsed = time.time() - start_time
log("[VS-LOG] total compute time %s"%time_elapsed)
for frame_index in range(len(frame_numbers)):
    # rotate to previous coordinates
    if frame_numbers[frame_index] == num_frames-1:
        old_coords = all_curr_coords[frame_index]# curr_coords

    else:
        # do Kabsch algorithm
        A = all_curr_coords[frame_index].transpose().dot(old_coords)
        U, S, V = numpy.linalg.svd(A)
        rot_mat = (V.transpose()).dot(U.transpose())

        # rotate to get new coordinates
        all_curr_coords[frame_index] = all_curr_coords[frame_index].dot(rot_mat.transpose())

        # update old coords
        old_coords = all_curr_coords[frame_index]

    # update x,y coords
    xcoords[frame_numbers[frame_index], :] = all_curr_coords[frame_index][:, 0]
    ycoords[frame_numbers[frame_index], :] = all_curr_coords[frame_index][:, 1]

# scale coords for VideoSwarm interface
#######################################

# get range for x
min_x = numpy.amin(xcoords)
max_x = numpy.amax(xcoords)

# get range for y
min_y = numpy.amin(ycoords)
max_y = numpy.amax(ycoords)

# scale coordinates to be in [0,1]^2
# if constant assign value of 1/2
xcoords = (xcoords - min_x)
if max_x > min_x:
    xcoords = xcoords / (max_x - min_x)
else:
    xcoords = xcoords + 0.5

ycoords = (ycoords - min_y)
if max_y > min_y:
    ycoords = ycoords / (max_y - min_y)
else:
    ycoords = ycoords + 0.5

# output results to VideoSwarm files
####################################

# check to see if working directory exists
if not os.path.exists(args.output_dir):

    # make diretory if it does not exist
    log("[VS-LOG] Creating working directory: " + args.output_dir)
    os.makedirs(args.output_dir)

# write out movies.meta (the .csv file)
log("[VS-LOG] Writing movies.csv file ...")

# add a column to the end of the csv with created movie files
for i in range(0, (len(meta_data))):
    if i == 0:
        meta_data[i].append("movie_files")
    else:
        meta_data[i].append(all_movies[i])


meta_file = open(os.path.join(args.output_dir, 'movies.csv'), 'w')
csv_meta_file = csv.writer(meta_file)
csv_meta_file.writerows(meta_data)
meta_file.close()

# write out movies.xcoords file (use only float precision)
log("[VS-LOG] Writing movies.xcoords ...")
xcoords_file = open(os.path.join(args.output_dir, 'movies.xcoords'), 'w')
csv_xcoords_file = csv.writer(xcoords_file)
for i in xcoords.tolist():
    csv_xcoords_file.writerow(['{:f}'.format(x) for x in i])
xcoords_file.close()

# write out movies.ycoords file
log("[VS-LOG] Writing movies.ycoords ...")
ycoords_file = open(os.path.join(args.output_dir, 'movies.ycoords'), 'w')
csv_ycoords_file = csv.writer(ycoords_file)
for i in ycoords.tolist():
    csv_ycoords_file.writerow(['{:f}'.format(y) for y in i])
ycoords_file.close()

# add time to first row of xcoords to make trajectories
time_row = numpy.linspace(0, vid_duration, num=num_frames)
traj = numpy.ones((num_rows + 1, num_frames))
traj[0, :] = time_row
traj[1:, :] = xcoords.transpose()

# write out movies.trajectories
log("[VS-LOG] Writing movies.trajectories ...")
traj_file = open(os.path.join(args.output_dir, 'movies.trajectories'), 'w')
csv_traj_file = csv.writer(traj_file)
for i in traj.tolist():
    csv_traj_file.writerow(['{:f}'.format(t) for t in i])
traj_file.close()

# done
######

log("[VS-LOG] All files written successfully to: " + str(args.output_dir))
log("[VS-FINISHED] parse_frames.py complete.")
